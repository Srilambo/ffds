const express = require('express');
const auth = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.get('/expiring', auth, inventoryController.expiring);
router.get('/', auth, inventoryController.list);
router.post('/', auth, inventoryController.create);
router.put('/:id', auth, inventoryController.update);
router.delete('/:id', auth, inventoryController.remove);

module.exports = router;
