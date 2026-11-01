
/* =====================================
   My Household Ledger
   전체 가계부 JavaScript
===================================== */


/* =====================================
   1. 기본 설정 및 변수
===================================== */

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
        Number.isSafeInteger(item.amount) &&
        item.amount > 0
      )
    : [];

} catch (error) {
  console.error("저장된 가계부 데이터를 불러오지 못했습니다.", error);
}

let selectedMonth = new Date();

let viewAllMonths = true;

let editingId = null;


/* =====================================
   2. HTML 요소 연결
===================================== */

const $ = (id) => document.getElementById(id);

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


/* =====================================
   3. 공통 함수
===================================== */

// 날짜를 YYYY-MM-DD 형식으로 반환
function getLocalDate(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// 금액에 쉼표 표시
function formatMoney(amount) {
  return Number(amount).toLocaleString("ko-KR") + "원";
}


// 날짜에서 연월 추출
function getMonthKey(date) {
  return date.slice(0, 7);
}


// 데이터 저장
function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions)
    );

    return true;

  } catch (error) {
    alert("데이터 저장에 실패했습니다. 브라우저 저장 공간을 확인해주세요.");
    console.error(error);
    return false;
  }
}


// 고유 ID 생성
function createId() {
  return Date.now().toString() +
    Math.random().toString(36).slice(2);
}


/* =====================================
   4. 비밀번호 로그인
===================================== */

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


// 로그인 버튼
loginForm.addEventListener("submit", function(e) {

  e.preventDefault();

  if (passwordInput.value === PASSWORD) {

    sessionStorage.setItem(
      "ledgerLogin",
      "true"
    );

    loginError.textContent = "";

    passwordInput.value = "";

    showLedger();

  } else {

    loginError.textContent =
      "비밀번호가 올바르지 않습니다.";

    passwordInput.value = "";

    passwordInput.focus();

  }

});


/* =====================================
   5. 월별 / 전체 기간 표시
===================================== */

function renderMonth() {

  if (viewAllMonths) {

    $("currentMonth").textContent = "전체 기간";

    return;
  }

  const year = selectedMonth.getFullYear();

  const month = selectedMonth.getMonth() + 1;

  $("currentMonth").textContent =
    `${year}년 ${month}월`;

}


/* =====================================
   6. 조회 대상 데이터
===================================== */

function getVisibleTransactions() {

  if (viewAllMonths) {
    return [...transactions];
  }

  const monthKey =
    `${selectedMonth.getFullYear()}-${String(
      selectedMonth.getMonth() + 1
    ).padStart(2, "0")}`;

  return transactions.filter(item =>
    getMonthKey(item.date) === monthKey
  );

}


/* =====================================
   7. 수입 / 지출 합계 계산
===================================== */

function renderSummary() {

  const visibleData = getVisibleTransactions();

  const income = visibleData

    .filter(item => item.type === "income")

    .reduce(
      (sum, item) => sum + item.amount,
      0
    );


  const expense = visibleData

    .filter(item => item.type === "expense")

    .reduce(
      (sum, item) => sum + item.amount,
      0
    );


  const balance = income - expense;


  $("totalIncome").textContent =
    formatMoney(income);

  $("totalExpense").textContent =
    formatMoney(expense);

  $("totalBalance").textContent =
    formatMoney(balance);

}


/* =====================================
   8. 거래 내역 출력
===================================== */

function renderTransactions() {

  const filter = $("filter").value;

  let filtered = getVisibleTransactions();


  // 수입 / 지출 필터

  if (filter !== "all") {

    filtered = filtered.filter(
      item => item.type === filter
    );

  }


  // 최신 날짜 순서

  filtered.sort((a, b) => {

    const dateCompare =
      b.date.localeCompare(a.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(b.id).localeCompare(String(a.id));

  });


  const list = $("transactionList");

  list.replaceChildren();


  // 내역이 없을 때

  if (filtered.length === 0) {

    const empty = document.createElement("div");

    empty.className = "empty";

    empty.textContent =
      "등록된 내역이 없습니다.";

    list.appendChild(empty);

    return;
  }


  // 거래 내역 생성

  filtered.forEach(item => {

    const row = document.createElement("div");

    row.className = "transaction";


    // 내역 정보

    const info = document.createElement("div");

    info.className = "transaction-info";


    const title = document.createElement("strong");

    title.textContent =
      item.memo || item.category;


    const detail = document.createElement("small");

    detail.textContent =
      `${item.date} · ${item.category}`;


    info.append(title, detail);


    // 금액 및 버튼 영역

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


    // 수정 버튼

    const actions = document.createElement("div");

    actions.className = "action-buttons";


    const editBtn = document.createElement("button");

    editBtn.type = "button";

    editBtn.textContent = "수정";

    editBtn.addEventListener("click", () => {

      editTransaction(item.id);

    });


    // 삭제 버튼

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


/* =====================================
   9. 전체 화면 새로고침
===================================== */

function renderAll() {

  renderMonth();

  renderSummary();

  renderTransactions();

}


/* =====================================
   10. 입력 폼 초기화
===================================== */

function resetForm() {

  form.reset();

  if (viewAllMonths) {

    dateInput.value = getLocalDate();

  } else {

    dateInput.value = getLocalDate(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      )
    );

  }

  editingId = null;

  submitBtn.textContent = "내역 추가하기";

  cancelEditBtn.hidden = true;

}


/* =====================================
   11. 수입 / 지출 등록
===================================== */

form.addEventListener("submit", function(e) {

  e.preventDefault();


  const amount = Number(amountInput.value);

  const date = dateInput.value;

  const memo = memoInput.value.trim();


  // 금액 검사

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {

    alert("1원 이상의 올바른 금액을 입력해주세요.");

    amountInput.focus();

    return;
  }


  // 날짜 검사

  if (!date) {

    alert("날짜를 입력해주세요.");

    dateInput.focus();

    return;
  }


  // 미래 날짜도 허용하며 날짜 형식만 검사
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {

    alert("올바른 날짜를 입력해주세요.");

    return;
  }


  const data = {

    type: typeInput.value,

    date: date,

    category: categoryInput.value,

    amount: amount,

    memo: memo

  };


  // 기존 내역 수정

  if (editingId !== null) {

    const index = transactions.findIndex(
      item => item.id === editingId
    );

    if (index !== -1) {

      const oldData = transactions[index];

      transactions[index] = {
        ...oldData,
        ...data
      };

    }

  }


  // 신규 내역 등록

  else {

    transactions.push({

      id: createId(),

      ...data

    });

  }


  // 저장 및 화면 갱신

  if (!saveData()) {
    return;
  }

  resetForm();

  renderAll();

});


/* =====================================
   12. 거래 내역 수정
===================================== */

function editTransaction(id) {

  const item = transactions.find(
    transaction => transaction.id === id
  );

  if (!item) return;


  editingId = id;


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


/* =====================================
   13. 거래 내역 삭제
===================================== */

function deleteTransaction(id) {

  const confirmed = confirm(
    "이 내역을 삭제하시겠습니까?"
  );

  if (!confirmed) return;


  const originalTransactions = transactions;

  transactions = transactions.filter(
    item => item.id !== id
  );


  if (!saveData()) {

    transactions = originalTransactions;

    return;
  }


  if (editingId === id) {

    resetForm();

  }


  renderAll();

}


/* =====================================
   14. 수정 취소
===================================== */

cancelEditBtn.addEventListener(
  "click",
  resetForm
);


/* =====================================
   15. 이전 달
===================================== */

$("prevMonth").addEventListener("click", function() {

  viewAllMonths = false;

  selectedMonth = new Date(

    selectedMonth.getFullYear(),

    selectedMonth.getMonth() - 1,

    1

  );

  resetForm();

  renderAll();

});


/* =====================================
   16. 다음 달
===================================== */

$("nextMonth").addEventListener("click", function() {

  viewAllMonths = false;

  selectedMonth = new Date(

    selectedMonth.getFullYear(),

    selectedMonth.getMonth() + 1,

    1

  );

  resetForm();

  renderAll();

});


/* =====================================
   17. 전체 기간 보기
===================================== */

$("allMonths").addEventListener("click", function() {

  viewAllMonths = true;

  resetForm();

  renderAll();

});


/* =====================================
   18. 수입 / 지출 필터
===================================== */

$("filter").addEventListener("change", function() {

  renderTransactions();

});


/* =====================================
   19. 최초 실행
===================================== */

function initializeApp() {

  dateInput.value = getLocalDate();

  renderAll();

  initializeLogin();

}

initializeApp();

