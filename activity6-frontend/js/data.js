import { config } from "./config.js";

const KEY = config.storageKey;

const INITIAL_RECORDS = [
  {
    id: 1,
    title: "Locate past exam papers for ICT251",
    category: "Book search",
    description: "Looking for archived web technologies exam papers and study guides in the reference section.",
    status: "Pending"
  },
  {
    id: 2,
    title: "Extend loan on database systems textbook",
    category: "Borrowing",
    description: "Requesting a seven-day renewal so I can finish exam revision before returning the book.",
    status: "In progress"
  },
  {
    id: 3,
    title: "Reset library borrowing card PIN",
    category: "Account help",
    description: "Unable to log into the online catalogue portal using my student credentials.",
    status: "Completed"
  },
  {
    id: 4,
    title: "Check availability of networking reference book",
    category: "Book search",
    description: "Want to know if a copy of Computer Networking is currently on the shelf or checked out.",
    status: "Pending"
  },
  {
    id: 5,
    title: "Clear overdue fine on returned novel",
    category: "Account help",
    description: "Returned the book yesterday afternoon and need the system balance updated.",
    status: "In progress"
  },
  {
    id: 6,
    title: "Reserve group study room for project work",
    category: "Borrowing",
    description: "Need a quiet table for three students to review coursework notes together.",
    status: "Pending"
  },
  {
    id: 7,
    title: "Find journal articles on algorithm analysis",
    category: "Book search",
    description: "Need help locating peer-reviewed articles on sorting and graph algorithms.",
    status: "Completed"
  },
  {
    id: 8,
    title: "Update student email on library profile",
    category: "Account help",
    description: "Due-date reminders are not arriving in my inbox; please verify my contact email.",
    status: "Pending"
  }
];

function loadRecords() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) {
    localStorage.setItem(KEY, JSON.stringify(INITIAL_RECORDS));
    return [...INITIAL_RECORDS];
  }
  return JSON.parse(raw);
}

function saveRecords(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

function getNextId(records) {
  const highestId = records.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return highestId + 1;
}

export const recordService = {
  async list() {
    return loadRecords();
  },

  async get(id) {
    const records = loadRecords();
    const match = records.find((item) => Number(item.id) === Number(id));
    if (!match) {
      throw new Error(`Record #${id} could not be found.`);
    }
    return { ...match };
  },

  async create(record) {
    const records = loadRecords();
    const newRecord = {
      id: getNextId(records),
      title: record.title.trim(),
      category: record.category.trim(),
      description: record.description.trim(),
      status: record.status
    };
    records.push(newRecord);
    saveRecords(records);
    return { ...newRecord };
  },

  async update(id, record) {
    const records = loadRecords();
    const index = records.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) {
      throw new Error(`Record #${id} could not be found.`);
    }
    const updatedRecord = {
      id: records[index].id,
      title: record.title.trim(),
      category: record.category.trim(),
      description: record.description.trim(),
      status: record.status
    };
    records[index] = updatedRecord;
    saveRecords(records);
    return { ...updatedRecord };
  },

  async remove(id) {
    const records = loadRecords();
    const remaining = records.filter((item) => Number(item.id) !== Number(id));
    if (remaining.length === records.length) {
      throw new Error(`Record #${id} could not be found.`);
    }
    saveRecords(remaining);
    return { message: `Request #${id} was deleted.` };
  }
};