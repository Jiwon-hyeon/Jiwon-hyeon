
const STORAGE_KEY = "myHouseholdLedger";

let transactions = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);

let selectedMonth = new Date();
let editingId = null;

const $ = (id) => document.getElementById(id);

const form = $("ledgerForm");
const typeInput = $("type");
const dateInput = $("date");
const categoryInput = $("category");
const amountInput = $("amount");
const memoInput = $("memo");

function formatMoney(amount) {
  return Number(amount).toLocaleString("ko-KR") + "원";
}

function getMonthKey(date) {
  return date.slice(0, 7);
}

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(transactions)
  );
}

function renderMonth() {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  $("currentMonth").textContent =
    `${year}년 ${month + 1}월`;
}

function renderSummary() {
  const monthKey = getMonthKey(
    `${selectedMonth.getFullYear()}-${String(
      selectedMonth.getMonth() + 1
    ).padStart(2, "0")}-01`
  );

  const monthlyData = transactions.filter(
    item => getMonthKey(item.date) === monthKey
  );

  const income = monthlyData
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expense = monthlyData
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  $("totalIncome").textContent = formatMoney(income);
  $("totalExpense").textContent = formatMoney(expense);
  $("totalBalance").textContent = formatMoney(income - expense);
}

function renderTransactions() {
  const monthKey =
    `${selectedMonth.getFullYear()}-${String(
      selectedMonth.getMonth() + 1
    ).padStart(2, "0")}`;

  const filter = $("filter").value;

  let filtered = transactions.filter(item =>
    getMonthKey(item.date) === monthKey
  );

  if (filter !== "all") {
    filtered = filtered.filter(
      item => item.type === filter
    );
  }

  filtered.sort((a, b) =>
    b.date.localeCompare(a.date) || b.id - a.id
  );

  const list = $("transactionList");
  list.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "등록된 내역이 없습니다.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach(item => {
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
    amount.className = "transaction-amount " +
      (item.type === "income"
        ? "amount-income"
        : "amount-expense");

    amount.textContent =
      (item.type === "income" ? "+" : "-") +
      formatMoney(item.amount);

    const actions = document.createElement("div");
    actions.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", () => editTransaction(item.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => deleteTransaction(item.id));

    actions.append(editBtn, deleteBtn);
    right.append(amount, actions);
    row.append(info, right);

    list.appendChild(row);
  });
}

function renderAll() {
  renderMonth();
  renderSummary();
  renderTransactions();
}

function resetForm() {
  form.reset();
  dateInput.value = new Date().toLocaleDateString("en-CA");
  editingId = null;
  $("submitBtn").textContent = "내역 추가하기";
  $("cancelEdit").hidden = true;
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const amount = Number(amountInput.value);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    alert("1원 이상의 올바른 금액을 입력해주세요.");
    return;
  }

  const data = {
    type: typeInput.value,
    date: dateInput.value,
    category: categoryInput.value,
    amount: amount,
    memo: memoInput.value.trim()
  };

  if (!data.date) {
    alert("날짜를 입력해주세요.");
    return;
  }

  if (editingId !== null) {
    const index = transactions.findIndex(
      item => item.id === editingId
    );

    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...data
      };
    }
  } else {
    transactions.push({
      id: Date.now(),
      ...data
    });
  }

  saveData();
  resetForm();
  renderAll();
});

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
  memoInput.value = item.memo;

  $("submitBtn").textContent = "수정 완료";
  $("cancelEdit").hidden = false;

  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function deleteTransaction(id) {
  if (!confirm("이 내역을 삭제하시겠습니까?")) {
    return;
  }

  transactions = transactions.filter(
    item => item.id !== id
  );

  if (editingId === id) {
    resetForm();
  }

  saveData();
  renderAll();
}

$("cancelEdit").addEventListener("click", resetForm);

$("prevMonth").addEventListener("click", () => {
  selectedMonth.setMonth(selectedMonth.getMonth() - 1);
  renderAll();
});

$("nextMonth").addEventListener("click", () => {
  selectedMonth.setMonth(selectedMonth.getMonth() + 1);
  renderAll();
});

$("filter").addEventListener("change", renderTransactions);

// 최초 실행
dateInput.value = new Date().toLocaleDateString("en-CA");
renderAll();
