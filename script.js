
/* =====================================
   MY HOUSEHOLD LEDGER
   전체 가계부 JavaScript
===================================== */


/* 1. 기본 설정 */

const PASSWORD = "5180";
const STORAGE_KEY = "myHouseholdLedger";

let transactions = [];

try {
  const savedData = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  transactions = Array.isArray(savedData)
    ? savedData.filter(item =>
        item &&
        typeof item.date === "string" &&
        ["income", "expense"].includes(item.type) &&
        Number.isSafeInteger(Number(item.amount)) &&
        Number(item.amount) > 0
      ).map(item => ({
        ...item,
        amount: Number(item.amount)
      }))
    : [];

} catch (error) {
  console.error("저장된 데이터를 불러오지 못했습니다.", error);
}

let selectedMonth = new Date();
let selectedYear = new Date().getFullYear();

let viewMode = "all";
// all = 전체 기간
// year = 연도별
// month = 월별

let editingId = null;


/* 2. HTML 요소 연결 */

const $ = id => document.getElementById(id);

const loginScreen = $("loginScreen");
const loginForm = $("loginForm");
const passwordInput = $("passwordInput");
const loginError = $("loginError");
const ledgerApp = $("ledgerApp");

const form = $("ledgerForm");

const typeInput = $("type");
const dateInput = $("date");
const categoryInput = $("category");
const amountInput = $("amount");
const memoInput = $("memo");

const submitBtn = $("submitBtn");
const cancelEditBtn = $("cancelEdit");


/* 3. 공통 함수 */

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(amount) {
  return Number(amount).toLocaleString("ko-KR") + "원";
}

function createId() {
  return Date.now().toString() +
    Math.random().toString(36).slice(2);
}

function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions)
    );
    return true;

  } catch (error) {
    alert("데이터 저장에 실패했습니다.");
    console.error(error);
    return false;
  }
}


/* 4. 로그인 기능 */

function showLedger() {
  loginScreen.hidden = true;
  ledgerApp.hidden = false;
  renderAll();
}

function initializeLogin() {
  const isLoggedIn =
    sessionStorage.getItem("ledgerLogin") === "true";

  if (isLoggedIn) {
    showLedger();
  } else {
    loginScreen.hidden = false;
    ledgerApp.hidden = true;
    passwordInput.focus();
  }
}

loginForm.addEventListener("submit", function(e) {
  e.preventDefault();

  if (passwordInput.value === PASSWORD) {
    sessionStorage.setItem("ledgerLogin", "true");

    loginError.textContent = "";
    passwordInput.value = "";

    showLedger();

  } else {
    loginError.textContent = "비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
  }
});


/* 5. 기간 표시 */

function renderPeriod() {

  const period = $("currentPeriod");

  if (viewMode === "all") {
    period.textContent = "전체 기간";

  } else if (viewMode === "year") {
    period.textContent = `${selectedYear}년`;

  } else {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    period.textContent = `${year}년 ${month}월`;
  }
}


/* 6. 조회 데이터 필터 */

function getVisibleTransactions() {

  if (viewMode === "all") {
    return [...transactions];
  }

  if (viewMode === "year") {
    return transactions.filter(item =>
      Number(item.date.slice(0, 4)) === selectedYear
    );
  }

  const monthKey =
    `${selectedMonth.getFullYear()}-${String(
      selectedMonth.getMonth() + 1
    ).padStart(2, "0")}`;

  return transactions.filter(item =>
    item.date.slice(0, 7) === monthKey
  );
}


/* 7. 수입 / 지출 합계 */

function renderSummary() {

  const data = getVisibleTransactions();

  const income = data
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expense = data
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = income - expense;

  $("totalIncome").textContent = formatMoney(income);
  $("totalExpense").textContent = formatMoney(expense);
  $("totalBalance").textContent = formatMoney(balance);
}


/* 8. 거래 내역 출력 */

function renderTransactions() {

  const filter = $("filter").value;

  let data = getVisibleTransactions();

  if (filter !== "all") {
    data = data.filter(item => item.type === filter);
  }

  data.sort((a, b) => {
    const result = b.date.localeCompare(a.date);

    if (result !== 0) return result;

    return String(b.id).localeCompare(String(a.id));
  });

  const list = $("transactionList");

  list.replaceChildren();

  if (data.length === 0) {
    const empty = document.createElement("div");

    empty.className = "empty";
    empty.textContent = "등록된 내역이 없습니다.";

    list.appendChild(empty);
    return;
  }

  data.forEach(item => {

    const row = document.createElement("div");
    row.className = "transaction";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const title = document.createElement("strong");
    title.textContent = item.memo || item.category;

    const detail = document.createElement("small");
    detail.textContent = `${item.date} · ${item.category}`;

    info.append(title, detail);

    const right = document.createElement("div");
    right.className = "transaction-right";

    const amount = document.createElement("span");

    amount.className =
      "transaction-amount " +
      (item.type === "income"
        ? "amount-income"
        : "amount-expense");

    amount.textContent =
      (item.type === "income" ? "+" : "-") +
      formatMoney(item.amount);

    const actions = document.createElement("div");
    actions.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "수정";

    editBtn.addEventListener("click", () => {
      editTransaction(item.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "삭제";

    deleteBtn.addEventListener("click", () => {
      deleteTransaction(item.id);
    });

    actions.append(editBtn, deleteBtn);

    right.append(amount, actions);

    row.append(info, right);

    list.appendChild(row);
  });
}


/* 9. 전체 화면 갱신 */

function renderAll() {
  renderPeriod();
  renderSummary();
  renderTransactions();
}


/* 10. 입력 폼 초기화 */

function resetForm() {

  form.reset();

  if (viewMode === "month") {
    dateInput.value = getLocalDate(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      )
    );

  } else if (viewMode === "year") {
    dateInput.value = getLocalDate(
      new Date(selectedYear, 0, 1)
    );

  } else {
    dateInput.value = getLocalDate();
  }

  editingId = null;

  submitBtn.textContent = "내역 추가하기";
  cancelEditBtn.hidden = true;
}


/* 11. 수입 / 지출 등록 */

form.addEventListener("submit", function(e) {

  e.preventDefault();

  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const memo = memoInput.value.trim();

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    alert("1원 이상의 올바른 금액을 입력해주세요.");
    amountInput.focus();
    return;
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    alert("올바른 날짜를 입력해주세요.");
    dateInput.focus();
    return;
  }

  const data = {
    type: typeInput.value,
    date: date,
    category: categoryInput.value,
    amount: amount,
    memo: memo
  };

  const originalTransactions = transactions;

  if (editingId !== null) {

    const index = transactions.findIndex(
      item => item.id === editingId
    );

    if (index === -1) {
      alert("수정할 내역을 찾을 수 없습니다.");
      return;
    }

    transactions[index] = {
      ...transactions[index],
      ...data
    };

  } else {

    transactions.push({
      id: createId(),
      ...data
    });
  }

  if (!saveData()) {
    transactions = originalTransactions;
    return;
  }

  resetForm();
  renderAll();
});


/* 12. 내역 수정 */

function editTransaction(id) {

  const item = transactions.find(
    transaction => String(transaction.id) === String(id)
  );

  if (!item) return;

  editingId = item.id;

  typeInput.value = item.type;
  dateInput.value = item.date;
  categoryInput.value = item.category;
  amountInput.value = item.amount;
  memoInput.value = item.memo || "";

  submitBtn.textContent = "수정 완료";
  cancelEditBtn.hidden = false;

  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* 13. 내역 삭제 */

function deleteTransaction(id) {

  if (!confirm("이 내역을 삭제하시겠습니까?")) {
    return;
  }

  const originalTransactions = transactions;

  transactions = transactions.filter(
    item => String(item.id) !== String(id)
  );

  if (!saveData()) {
    transactions = originalTransactions;
    return;
  }

  if (String(editingId) === String(id)) {
    resetForm();
  }

  renderAll();
}


/* 14. 수정 취소 */

cancelEditBtn.addEventListener("click", resetForm);


/* 15. 이전 기간 */

$("prevPeriod").addEventListener("click", function() {

  if (viewMode === "all") {

    viewMode = "month";

    selectedMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1
    );

  } else if (viewMode === "year") {

    selectedYear--;

  } else {

    selectedMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() - 1,
      1
    );
  }

  resetForm();
  renderAll();
});


/* 16. 다음 기간 */

$("nextPeriod").addEventListener("click", function() {

  if (viewMode === "all") {

    viewMode = "month";

    selectedMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    );

  } else if (viewMode === "year") {

    selectedYear++;

  } else {

    selectedMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      1
    );
  }

  resetForm();
  renderAll();
});


/* 17. 월별 보기 */

$("monthView").addEventListener("click", function() {

  viewMode = "month";

  selectedMonth = new Date(
    selectedYear,
    selectedMonth.getMonth(),
    1
  );

  resetForm();
  renderAll();
});


/* 18. 연도별 보기 */

$("yearView").addEventListener("click", function() {

  viewMode = "year";

  selectedYear = new Date().getFullYear();

  resetForm();
  renderAll();
});


/* 19. 전체 기간 보기 */

$("allMonths").addEventListener("click", function() {

  viewMode = "all";

  resetForm();
  renderAll();
});


/* 20. 수입 / 지출 필터 */

$("filter").addEventListener("change", function() {
  renderTransactions();
});


/* 21. 최초 실행 */

function initializeApp() {

  dateInput.value = getLocalDate();

  renderAll();

  initializeLogin();
}

initializeApp();
