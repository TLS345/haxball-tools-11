// Day 11/365 - Slide
// By TLS / Teleese

const KICKING_DAMPING = 0.9649;
let kickState = {};

setInterval(() => {
    const players = room.getPlayerList();
    players.forEach(p => {
        const props = room.getPlayerDiscProperties(p.id);
        if (!props) return;

        const isKicking = props.damping === KICKING_DAMPING;

        if (!kickState[p.id]) {
            kickState[p.id] = {
                last: false,
                startTime: 0,
                cooldownUntil: 0,
                kicked: false,
                intervalId: null
            };
        }

        if (isKicking && !kickState[p.id].last) {
            kickState[p.id].startTime = Date.now();
            kickState[p.id].kicked = false;
        }

        if (isKicking && !kickState[p.id].kicked && Date.now() - kickState[p.id].startTime >= 1500) {
            kickState[p.id].kicked = true;
            applyKick(p);
        }

        kickState[p.id].last = isKicking;
    });
}, 60);

function applyKick(p) {
    const now = Date.now();
    if (now < kickState[p.id].cooldownUntil) {
        const remaining = Math.ceil((kickState[p.id].cooldownUntil - now) / 1000);
        room.sendAnnouncement(`Cooldown: ${remaining}s`, p.id);
        return;
    }

    const props = room.getPlayerDiscProperties(p.id);
    if (!props) return;

    const dirX = props.xspeed || 1;
    const dirY = props.yspeed || 1;
    const length = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    const normX = dirX / length;
    const normY = dirY / length;

    const BOOST = 3;
    room.setPlayerDiscProperties(p.id, {
        xspeed: props.xspeed + BOOST * normX,
        yspeed: props.yspeed + BOOST * normY
    });

    room.setPlayerAvatar(p.id, "👟");

    const duration = 3000;
    const startTime = Date.now();

    if (kickState[p.id].intervalId) clearInterval(kickState[p.id].intervalId);
    kickState[p.id].intervalId = setInterval(() => {
        const curProps = room.getPlayerDiscProperties(p.id);
        if (!curProps) return;

        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
            clearInterval(kickState[p.id].intervalId);
            kickState[p.id].intervalId = null;
            room.setPlayerAvatar(p.id, "");
            return;
        }

        const factor = 1 - (elapsed / duration) * 0.7; 
        room.setPlayerDiscProperties(p.id, {
            xspeed: curProps.xspeed * factor,
            yspeed: curProps.yspeed * factor
        });
    }, 60);

    kickState[p.id].cooldownUntil = now + 23000;
}


function initPlayer(player) {
    player.activation = 0;
    player.slowdown = 0;
    player.slowdownUntil = 0;
    player.canCallFoulUntil = 0;
    player.foulsMeter = 0;
    player.fouledAt = { x: 0, y: 0 };
    player.kickingFrames = 0;
    player.lastKickingState = false;
    player.kickingStartTime = 0;
    player.joinTime = Date.now();
}

