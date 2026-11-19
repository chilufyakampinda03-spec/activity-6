import { recordService } from "./data.js";

const VALID_STATUSES = ["Pending", "In progress", "Completed"];

const form = document.getElementById("request-form");
const idInput = document.getElementById("record-id");
const titleInput = document.getElementById("record-title");
const categoryInput = document.getElementById("record-category");
const descriptionInput = document.getElementById("record-description");
const statusSelect = document.getElementById("record-status");
const formHeading = document.getElementById("form-heading");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const detailPanel = document.getElementById("detail-panel");
const feedbackBanner = document.getElementById("feedback-banner");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const resultCount = document.getElementById("result-count");
const recordsTbody = document.getElementById("records-tbody");
const emptyState = document.getElementById("empty-state");

const deleteConfirmBox = document.getElementById("delete-confirm");
const deleteConfirmMsg = document.getElementById("delete-confirm-msg");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

let editingId = null;
let pendingDeleteId = null;
let selectedDetailId = null;

function showFeedback(message, type = "success") {
  feedbackBanner.textContent = message;
  feedbackBanner.className = `feedback feedback--${type}`;
  feedbackBanner.hidden = false;
}

function clearFeedback() {
  feedbackBanner.textContent = "";
  feedbackBanner.hidden = true;
}

function validateRecordInput(raw) {
  const title = (raw.title || "").trim();
  const category = (raw.category || "").trim();
  const description = (raw.description || "").trim();
  const status = raw.status;

  if (title.length < 3 || title.length > 80) {
    return { valid: false, error: "Title must be between 3 and 80 characters after trimming spaces." };
  }
  if (category.length < 2 || category.length > 40) {
    return { valid: false, error: "Category must be between 2 and 40 characters after trimming spaces." };
  }
  if (description.length < 5 || description.length > 300) {
    return { valid: false, error: "Description must be between 5 and 300 characters after trimming spaces." };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { valid: false, error: "Status must be Pending, In progress, or Completed." };
  }

  return {
    valid: true,
    data: { title, category, description, status }
  };
}

function resetFormToCreate() {
  editingId = null;
  form.reset();
  idInput.value = "";
  idInput.placeholder = "Auto-generated";
  statusSelect.value = "Pending";
  formHeading.textContent = "Add New Request";
  submitBtn.textContent = "Save Request";
  cancelEditBtn.hidden = true;
}

function statusBadgeClass(status) {
  if (status === "In progress") return "status-badge status--in-progress";
  if (status === "Completed") return "status-badge status--completed";
  return "status-badge status--pending";
}

function renderDetail(record) {
  detailPanel.textContent = "";

  if (!record) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Select View on any request to inspect its full details.";
    detailPanel.appendChild(p);
    return;
  }

  const rows = [
    ["ID: ", String(record.id)],
    ["Title: ", record.title],
    ["Category: ", record.category],
    ["Status: ", record.status],
    ["Description: ", record.description]
  ];

  rows.forEach(([label, value]) => {
    const p = document.createElement("p");
    p.className = "detail-row";
    const strong = document.createElement("strong");
    strong.textContent = label;
    const span = document.createElement("span");
    span.textContent = value;
    p.append(strong, span);
    detailPanel.appendChild(p);
  });
}

function hideDeleteConfirm() {
  pendingDeleteId = null;
  deleteConfirmBox.hidden = true;
  deleteConfirmMsg.textContent = "";
}

async function renderList() {
  const allRecords = await recordService.list();
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filtered = allRecords.filter((item) => {
    const matchesTitle = item.title.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;
    return matchesTitle && matchesStatus;
  });

  resultCount.textContent = `Showing ${filtered.length} of ${allRecords.length} records`;
  recordsTbody.textContent = "";

  if (filtered.length === 0) {
    emptyState.hidden = false;
    if (allRecords.length === 0) {
      emptyState.textContent = "No library service requests are stored yet. Use the form above to add one.";
    } else {
      emptyState.textContent = "No matching records found for your current search or status filter.";
    }
    return;
  }

  emptyState.hidden = true;

  filtered.forEach((item) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = String(item.id);

    const tdTitle = document.createElement("td");
    tdTitle.textContent = item.title;

    const tdCategory = document.createElement("td");
    tdCategory.textContent = item.category;

    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = statusBadgeClass(item.status);
    badge.textContent = item.status;
    tdStatus.appendChild(badge);

    const tdActions = document.createElement("td");
    const actionGroup = document.createElement("div");
    actionGroup.className = "action-group";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-secondary btn-sm";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", async () => {
      try {
        const current = await recordService.get(item.id);
        selectedDetailId = current.id;
        renderDetail(current);
        clearFeedback();
      } catch (err) {
        showFeedback(err.message, "error");
      }
    });

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-secondary btn-sm";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", async () => {
      try {
        const current = await recordService.get(item.id);
        editingId = current.id;
        idInput.value = String(current.id);
        titleInput.value = current.title;
        categoryInput.value = current.category;
        descriptionInput.value = current.description;
        statusSelect.value = current.status;
        formHeading.textContent = `Edit Request #${current.id}`;
        submitBtn.textContent = "Update Request";
        cancelEditBtn.hidden = false;
        hideDeleteConfirm();
        clearFeedback();
        titleInput.focus();
      } catch (err) {
        showFeedback(err.message, "error");
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      pendingDeleteId = item.id;
      deleteConfirmMsg.textContent = `Are you sure you want to delete request #${item.id}: "${item.title}"?`;
      deleteConfirmBox.hidden = false;
      confirmDeleteBtn.focus();
    });

    actionGroup.append(viewBtn, editBtn, deleteBtn);
    tdActions.appendChild(actionGroup);

    tr.append(tdId, tdTitle, tdCategory, tdStatus, tdActions);
    recordsTbody.appendChild(tr);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const check = validateRecordInput({
    title: titleInput.value,
    category: categoryInput.value,
    description: descriptionInput.value,
    status: statusSelect.value
  });

  if (!check.valid) {
    showFeedback(check.error, "error");
    return;
  }

  try {
    if (editingId !== null) {
      const updated = await recordService.update(editingId, check.data);
      if (selectedDetailId === updated.id) {
        renderDetail(updated);
      }
      resetFormToCreate();
      await renderList();
      showFeedback(`Updated request #${updated.id} ("${updated.title}").`, "success");
    } else {
      const created = await recordService.create(check.data);
      resetFormToCreate();
      await renderList();
      showFeedback(`Added new request #${created.id} ("${created.title}").`, "success");
    }
  } catch (err) {
    showFeedback(err.message, "error");
  }
});

cancelEditBtn.addEventListener("click", () => {
  resetFormToCreate();
  clearFeedback();
  showFeedback("Edit cancelled.", "success");
});

cancelDeleteBtn.addEventListener("click", () => {
  hideDeleteConfirm();
  showFeedback("Deletion cancelled. Record was kept.", "success");
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (pendingDeleteId === null) return;
  const idToDelete = pendingDeleteId;

  try {
    const result = await recordService.remove(idToDelete);
    if (editingId === idToDelete) {
      resetFormToCreate();
    }
    if (selectedDetailId === idToDelete) {
      selectedDetailId = null;
      renderDetail(null);
    }
    hideDeleteConfirm();
    await renderList();
    showFeedback(result.message, "success");
  } catch (err) {
    hideDeleteConfirm();
    showFeedback(err.message, "error");
  }
});

searchInput.addEventListener("input", () => {
  renderList();
});

statusFilter.addEventListener("change", () => {
  renderList();
});

renderDetail(null);
renderList();