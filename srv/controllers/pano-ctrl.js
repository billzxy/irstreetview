const Pano = require("../models/pano-db-model");

const createPano = (req, res) => {
	const body = req.body;

	if (!body) {
		return res.status(400).json({
			success: false,
			error: "You must provide a pano"
		});
	}

	const pano = new Pano(body);

	if (!pano) {
		return res.status(400).json({ success: false, error: err });
	}

	pano
		.save()
		.then(() => {
			return res.status(201).json({
				success: true,
				id: pano._id,
				message: "Pano created!"
			});
		})
		.catch(error => {
			return res.status(400).json({
				error,
				message: "Pano not created!"
			});
		});
};

const deletePano = async (req, res) => {
	await Pano.findOneAndDelete({ _id: req.params.id }, (err, pano) => {
		if (err) {
			return res.status(400).json({ success: false, error: err });
		}

		if (!pano) {
			return res.status(404).json({ success: false, error: `Pano not found` });
		}

		return res.status(200).json({ success: true, data: pano });
	}).catch(err => console.log(err));
};

const getPanoById = async (req, res) => {
	await Pano.findOne({ id: req.params.id }, (err, pano) => {
		if (err) {
			return res.status(400).json({ success: false, error: err });
		}

		if (!pano) {
			return res.status(404).json({ success: false, error: `Pano not found` });
		}
		return res.status(200).json({ success: true, data: pano });
	}).catch(err => console.log(err));
};

const getPanoFileNameById = async (req, res) => {
	await Pano.findOne({ id: req.params.id }, (err, pano) => {
		if (err) {
			return res.status(400).json({ success: false, error: err });
		}

		if (!pano) {
			return res.status(404).json({ success: false, error: `Pano not found` });
		}
		return res.status(200).json({ success: true, filename: pano.filename });
	}).catch(err => console.log(err));
};

const getPanoCoordById = async (req, res) => {
	await Pano.findOne({ id: req.params.id }, (err, pano) => {
		if (err) {
			return res.status(400).json({ success: false, error: err });
		}

		if (!pano) {
			return res.status(404).json({ success: false, error: `Pano not found` });
		}
		return res.status(200).json({ success: true, coord: pano.coord });
	}).catch(err => console.log(err));
};

const getPanos = async (req, res) => {
	await Pano.find({}, (err, panos) => {
		if (err) {
			return res.status(400).json({ success: false, error: err });
		}
		if (!panos.length) {
			return res.status(404).json({ success: false, error: `Pano not found` });
		}
		return res.status(200).json({ success: true, data: panos });
	}).catch(err => console.log(err));
};

const getAllPanosIdAndCoords = async (req, res) => {
	await Pano.find({}, "id coord", (err, panos) => {
		if (err) {
			return res.status(400).json({ success: false, error: err });
		}
		if (!panos.length) {
			return res.status(404).json({ success: false, error: `Pano not found` });
		}
		return res.status(200).json({ success: true, data: panos });
	}).catch(err => console.log(err));
};

const getPanoAllAttrById = async (req, res) => {
	await Pano.findOne({ id: req.params.id }, (err, pano) => {
		if (err) {
			return res.status(400).json({ success: false, error: err });
		}

		if (!pano) {
			return res.status(404).json({ success: false, error: `Pano not found` });
		}
		return res
			.status(200)
			.json({
				success: true,
				data: {
					filename: pano.filename,
					coord: pano.coord,
					calibration: pano.calibration
				}
			});
	}).catch(err => console.log(err));
};

const updatePanoCalibration = async (req, res) => {
	const body = req.body;
	if (!body) {
		return res.status(400).json({
			success: false,
			error: "You must provide a body to update"
		});
	}
	Pano.findOne({ id: req.params.id }, (err, pano) => {
		if (err) {
			return res.status(404).json({
				err,
				message: "Pano not found!"
			});
		}
		pano.azimuth = [];
		pano.calibration = body.calibration;

		pano
			.save()
			.then(() => {
				return res.status(200).json({
					success: true,
					id: pano.id,
					message: "Calibration updated!"
				});
			})
			.catch(error => {
				return res.status(404).json({
					error,
					message: "Calibration not updated!"
				});
			});
	});
};

module.exports = {
	createPano,
	deletePano,
	getPanos,
	getPanoCoordById,
	getPanoFileNameById,
	getPanoById,
	getAllPanosIdAndCoords,
	getPanoAllAttrById,
	updatePanoCalibration
};
