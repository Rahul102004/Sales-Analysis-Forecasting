const inventoryService = require("../services/inventoryService");

async function getInventory(req, res) {
  try {
    const rows = await inventoryService.getAll();
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function getStats(req, res) {
  try {
    const stats = await inventoryService.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function addItem(req, res) {
  try {
    await inventoryService.create(req.body);
    res.status(201).send("Created");
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function updateItem(req, res) {
  try {
    await inventoryService.update(req.params.id, req.body);
    res.send("Updated");
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function deleteItem(req, res) {
  try {
    await inventoryService.remove(req.params.id);
    res.send("Deleted");
  } catch (err) {
    res.status(400).send(err.message);
  }
}

module.exports = { getInventory, getStats, addItem, updateItem, deleteItem };
