module.exports = {
    // Game states
    GAME_STATES: {
        WAITING: 'waiting',
        DRAWING: 'drawing',
        REVEALING: 'revealing',
        COMPLETE: 'complete'
    },

    // Body parts
    BODY_PARTS: {
        HEAD: 'head',
        TORSO: 'torso',
        LEGS: 'legs'
    },

    // Body part order (top to bottom)
    BODY_PART_ORDER: ['head', 'torso', 'legs'],

    // Default settings
    DEFAULTS: {
        DRAWING_TIME: parseInt(process.env.DEFAULT_DRAWING_TIME) || 180,
        MAX_PLAYERS: parseInt(process.env.MAX_PLAYERS_PER_LOBBY) || 6,
        INVITE_CODE_LENGTH: 6
    },

    // Canvas dimensions
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 400, // Each body part canvas
        HINT_PERCENTAGE: 0.1 // 10% of canvas height for hints
    }
};
