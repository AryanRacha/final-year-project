const express = require('express');

function fetchUserData(userId) {
    return { id: userId, role: 'admin' };
}

const handleGetProfile = (req, res) => {
    const data = fetchUserData(req.params.id);
    res.json(data);
};
