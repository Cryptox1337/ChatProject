const router = require('express').Router();
const Server = require('../models/ServersModel');
const ServerMembers = require('../models/ServerMembersModel');
const { auth } = require('../middlewares/auth');
const { HTTP_STATUS_CODES } = require('../constants');

// POST create a new server
router.post('/', auth(), async (req, res) => {
	try {
		const { name } = req.body;
		if (!name) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ message: 'Server name is required' });}

		// Create a new server
		const server = new Server({name, owner: req.user.id});
	  	await server.save();
		
		// Add the owner as a member of the server
		const serverMember = new ServerMembers({server: server.id, user: req.user.id, joined_at: new Date()});
		await serverMember.save();
		
		res.status(HTTP_STATUS_CODES.CREATED).json({ server });
  	} catch (error) {
		console.error(error);
		res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
	}
});

// DELETE a server by ID
router.delete('/:serverId', auth(), async (req, res) => {
	try {
  		const { serverId } = req.params;

  		// Get the server by ID
  		const server = await Server.findById(serverId);
  		if (!server) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ message: 'Server not found' });}

  		// Check if the requester is the server owner
  		if (server.owner !== req.user.id) {return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ message: 'You are not the owner of this server' });}

    	// Remove all members of the server from ServerMembers collection
    	await ServerMembers.deleteMany({ server: serverId });

  		// Delete the server
  		await server.remove();
		res.status(HTTP_STATUS_CODES.OK).json({ message: 'Server deleted successfully' });
	} catch (error) {
		console.error(error);
		res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
	}
});

module.exports = router;