const STORAGE_KEY = "todo-list-items";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const emptyMessage = document.querySelector("#empty-message");
const count = document.querySelector("#todo-count");
const storageStatus = document.querySelector("#storage-status");
const filterGroup = document.querySelector("#filter-group");
const filterButtons = [...filterGroup.querySelectorAll("[data-filter]")];
const filterFeedback = document.querySelector("#filter-feedback");

let storage = getAvailableStorage();
let todos = loadTodos();
let activeFilter = "all";

// 優先使用 localStorage；部分瀏覽器限制直接開啟本機檔案時，改用可跨重新整理保留的 sessionStorage。
function getAvailableStorage() {
  try {
    const fallbackStorage = window.sessionStorage;
    const fallbackData = fallbackStorage.getItem(STORAGE_KEY);
    if (fallbackData !== null) {
      fallbackStorage.setItem(`${STORAGE_KEY}-test`, "1");
      fallbackStorage.removeItem(`${STORAGE_KEY}-test`);
      storageStatus.textContent =
        "瀏覽器限制了本機檔案的永久儲存，資料會保留到此分頁關閉。";
      return fallbackStorage;
    }
  } catch (error) {
    console.warn("sessionStorage 無法讀取後備資料：", error);
  }

  const candidates = [
    {
      name: "localStorage",
      get: () => window.localStorage,
      message: "",
    },
    {
      name: "sessionStorage",
      get: () => window.sessionStorage,
      message: "瀏覽器限制了本機檔案的永久儲存，資料會保留到此分頁關閉。",
    },
  ];

  for (const candidate of candidates) {
    try {
      const candidateStorage = candidate.get();
      const testKey = `${STORAGE_KEY}-test`;
      candidateStorage.setItem(testKey, "1");
      candidateStorage.removeItem(testKey);
      storageStatus.textContent = candidate.message;
      return candidateStorage;
    } catch (error) {
      console.warn(`${candidate.name} 無法使用：`, error);
    }
  }

  storageStatus.textContent = "瀏覽器已停用網頁儲存，資料將無法在重新整理後保留。";
  return null;
}

// 只顯示已儲存資料中格式正確的項目，避免舊資料造成頁面錯誤。
function loadTodos() {
  if (!storage) {
    return [];
  }

  try {
    const savedTodos = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");

    if (!Array.isArray(savedTodos)) {
      throw new Error("儲存的待辦資料格式不正確。");
    }

    return savedTodos
      .map((todo) => {
        const text = typeof todo?.text === "string" ? todo.text.trim() : "";
        if (!text) {
          return null;
        }

        return {
          id:
            typeof todo.id === "string" || typeof todo.id === "number"
              ? String(todo.id)
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text,
          completed:
            typeof todo.completed === "boolean" ? todo.completed : Boolean(todo.done),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("無法讀取待辦資料：", error);
    storageStatus.textContent = "無法讀取已儲存的資料，將從空白清單開始。";
    return [];
  }
}

// 每次資料異動都同步寫入瀏覽器，讓重新整理後仍可保留內容。
function saveTodos() {
  if (!storage) {
    storageStatus.textContent = "瀏覽器已停用網頁儲存，資料只會保留在目前畫面。";
    return;
  }

  try {
    const serializedTodos = JSON.stringify(todos);
    storage.setItem(STORAGE_KEY, serializedTodos);

    if (storage.getItem(STORAGE_KEY) !== serializedTodos) {
      throw new Error("寫入後無法讀回相同資料。");
    }
  } catch (error) {
    console.error("無法儲存待辦資料：", error);

    try {
      const fallbackStorage = window.sessionStorage;
      const serializedTodos = JSON.stringify(todos);
      fallbackStorage.setItem(STORAGE_KEY, serializedTodos);
      if (fallbackStorage.getItem(STORAGE_KEY) !== serializedTodos) {
        throw new Error("後備儲存寫入後無法讀回相同資料。");
      }

      storage = fallbackStorage;
      storageStatus.textContent =
        "瀏覽器限制了本機檔案的永久儲存，資料會保留到此分頁關閉。";
    } catch (fallbackError) {
      console.error("無法使用後備儲存：", fallbackError);
      storageStatus.textContent = "目前無法儲存變更，請確認瀏覽器的儲存設定。";
    }
  }
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = "todo-item";
  item.dataset.id = todo.id;

  const label = document.createElement("label");
  label.className = "todo-label";

  const checkbox = document.createElement("input");
  checkbox.className = "todo-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.dataset.action = "toggle";

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.setAttribute("aria-label", `刪除：${todo.text}`);
  deleteButton.title = "刪除";
  deleteButton.textContent = "×";

  label.append(checkbox, text);
  item.append(label, deleteButton);
  return item;
}

function renderTodos() {
  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === "active") {
      return !todo.completed;
    }
    if (activeFilter === "completed") {
      return todo.completed;
    }
    return true;
  });
  const fragment = document.createDocumentFragment();
  visibleTodos.forEach((todo) => fragment.append(createTodoElement(todo)));
  list.replaceChildren(fragment);

  const hasTodos = todos.length > 0;
  const emptyMessages = {
    all: "還沒有任何待辦事項,新增一個吧!",
    active: "目前沒有未完成的事項；已完成事項仍保留，可切換到「已完成」查看。",
    completed: "目前沒有已完成的事項；未完成事項仍保留，可切換到「未完成」查看。",
  };
  emptyMessage.textContent = hasTodos
    ? emptyMessages[activeFilter]
    : "還沒有任何待辦事項,新增一個吧!";
  emptyMessage.hidden = visibleTodos.length > 0;

  const incompleteCount = todos.filter((todo) => !todo.completed).length;
  count.textContent = `未完成:${incompleteCount} 項`;

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === activeFilter));
  });
}

function showFilterFeedback(message) {
  filterFeedback.textContent = message;
  filterFeedback.hidden = false;
}

function clearFilterFeedback() {
  filterFeedback.textContent = "";
  filterFeedback.hidden = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    input.value = "";
    input.focus();
    return;
  }

  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
  });

  input.value = "";
  saveTodos();
  renderTodos();
  input.focus();
});

list.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".todo-checkbox");
  if (!checkbox) {
    return;
  }

  const item = checkbox.closest(".todo-item");
  const todo = todos.find((entry) => entry.id === item.dataset.id);
  if (!todo) {
    return;
  }

  todo.completed = checkbox.checked;
  if (activeFilter === "completed" && !todo.completed) {
    showFilterFeedback(
      "這筆事項已移至「未完成」，資料沒有被刪除；可切換到「全部」查看。",
    );
  } else if (activeFilter === "active" && todo.completed) {
    showFilterFeedback(
      "這筆事項已移至「已完成」，資料沒有被刪除；可切換到「全部」查看。",
    );
  } else {
    clearFilterFeedback();
  }
  saveTodos();
  renderTodos();
});

list.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-button");
  if (!deleteButton) {
    return;
  }

  const item = deleteButton.closest(".todo-item");
  todos = todos.filter((todo) => todo.id !== item.dataset.id);
  saveTodos();
  renderTodos();
});

filterGroup.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) {
    return;
  }

  activeFilter = button.dataset.filter;
  clearFilterFeedback();
  renderTodos();
});

renderTodos();
