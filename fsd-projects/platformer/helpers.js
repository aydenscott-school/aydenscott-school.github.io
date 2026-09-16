///// DO NOT CHANGE ANYTHING IN THIS FILE /////

///////////////////////////////////////////////
// Core functionality /////////////////////////
///////////////////////////////////////////////
function registerSetup(setup) {
  setupGame = setup;
}

function main() {
  ctx.clearRect(0, 0, 1400, 750); //erase the screen so you can draw everything in it's most current position

  gameFrame++;

  if (introActive) {
    drawIntro();
    return;
  }

  gameplayFrame++;

  drawPacmanBackground();

  if (gambleActive) {
    drawPowerGamble();
    return;
  }

  updateCannonBarrage();

  if (shouldDrawGrid) {
    makeGrid();
  }

  if (player.deadAndDeathAnimationDone) {
    deathOfPlayer();
    return;
  }

  if (player.winConditionMet) {
    winGame();
    return;
  }

  drawPlatforms();
  drawFakePlatforms();
  drawBadPlatforms();
  drawPellets();
  drawPowerCubes();
  drawProjectiles();
  drawCannons();
  drawCollectables();
  playerFrictionAndGravity();

  player.x += player.speedX;
  player.y += player.speedY;

  collision(); //checks if the player will collide with something in this frame
  keyboardControlActions(); //keyboard controls.
  projectileCollision(); //checks if the player is getting hit by a projectile in the next frame
  badPlatformCollision(); //checks if the player is touching a bad platform
  collectablesCollide(); //checks if player has touched a collectable
  pelletsCollide();
  powerCubesCollide();

  drawScoreHud();

  animate(); //this changes halle's picture to the next frame so it looks animated.
  // debug()                   //debugging values. Comment this out when not debugging.
  drawRobot(); //this actually displays the image of the robot.
  if (player.shieldActive) {
    ctx.strokeStyle = "rgba(80, 220, 255, 0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x + hitBoxWidth / 2, player.y + hitBoxHeight / 2, 48, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (barrageWarningActive || barrageActive) {
    drawBarrageWarning();
  }
}

function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "json";
  xhr.onload = function () {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
      setupGame();
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
}

function JsonFunction(status, response) {
  /*
      diagram of the json
      top level is the name of the animation
      also don't you dare complain, this is operation sparks fault for making the animation so complicated.
      animation name{
          coordinates{
              sx: xpadding,
              sy: ypadding,
              width: cords.swidth,
              height: cords.sheight,
              hitWidth: 50, //cords.width,
              hitHeight: 105,//cords.height,
              hitDx: 0,
              hitDy: 0,
              xoffset: xoffset,
              yoffset: yoffset,
          }
          maxHeight: largest size the sprite can be
          maxWidth: 
      }
    */
  animationDetails = response;
}

///////////////////////////////////////////////
// Helper functions ///////////////////////////
///////////////////////////////////////////////

function changeAnimationType() {
  if (currentAnimationType === animationTypes.frontDeath) {
    if (
      frameIndex >= animationDetails[currentAnimationType].coordinates.length
    ) {
      player.deadAndDeathAnimationDone = true;
    }
    return;
  }
  if (jumpTimer > 0 && !player.onGround) {
    currentAnimationType = animationTypes.jump;
    jumpTimer--;
  } else {
    jumpTimer = 0;
    if (Math.abs(player.speedX) > 0) {
      //if you're moving then change animation to walking or running
      if (keyPress.left || keyPress.right) {
        currentAnimationType = animationTypes.run;
      } else {
        currentAnimationType = animationTypes.walk;
      }
    } else if (player.onGround) {
      if (keyPress.down) {
        currentAnimationType = animationTypes.duck;
        if (duckTimer < DUCK_COUNTER_IDLE_VALUE) {
          // not using index 0 because the animation is too slow then
          frameIndex = 3;
          duckTimer = DUCK_COUNTER_IDLE_VALUE * 2 - frameIndex;
        }
      } else if (
        duckTimer === 0 ||
        currentAnimationType === animationTypes.walk
      ) {
        currentAnimationType = animationTypes.frontIdle;
      }
    }
  }
}

function debug() {
  debugVar = true;

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
  ctx.fillText("xs" + player.speedX + " x: " + player.x, 500, 200);
  ctx.fillText("ys" + player.speedY + " y: " + player.y, 500, 250);

  ctx.fillStyle = "black";
  ctx.fillText("on ground " + player.onGround, 150 + player.x, player.y - 20);
  ctx.fillText("hitx" + hitDx, 150 + player.x, player.y);
  ctx.fillText("hity" + hitDy, 150 + player.x, player.y + 20);
  ctx.fillText("offsetx" + offsetX, 150 + player.x, player.y + 40);
  ctx.fillText("offsetY" + offsetY, 150 + player.x, player.y + 60);

  ctx.fillStyle = "grey";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  //debug showing collision
  ctx.fillStyle = "yellow";
  ctx.fillRect(500, 100, 50, 50);

  ctx.fillStyle = "green";
  ctx.fillRect(player.x, player.y, hitBoxWidth, hitBoxHeight);

  if (collision() !== undefined) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(player.x, player.y - 50, 10, 10);
  }
}

function animate() {
  if (
    !(
      keyPress.down &&
      duckTimer === DUCK_COUNTER_IDLE_VALUE &&
      currentAnimationType === animationTypes.duck
    )
  ) {
    frameIndex = frameIndex + 15 / frameRate;
    if (duckTimer > 0) {
      duckTimer -= 0.25;
    }
  }
  changeAnimationType();
  if (frameIndex >= animationDetails[currentAnimationType].coordinates.length) {
    frameIndex = 0;
  }
  spriteX =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .sx;
  spriteY =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .sy;
  spriteWidth =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .width;
  spriteHeight =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .height;
  maxWidth = animationDetails[currentAnimationType].maxWidth * playerScale;
  maxHeight = animationDetails[currentAnimationType].maxHeight * playerScale;
  offsetX =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .xoffset * playerScale;
  offsetY =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .yoffset * playerScale;
  player.width =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .width * playerScale;
  player.height =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .height * playerScale;
  hitDx =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .hitDx * playerScale;
  hitDy =
    animationDetails[currentAnimationType].coordinates[Math.floor(frameIndex)]
      .hitDy * playerScale;
}

function drawRobot() {
  //ctx.drawImage(imageVaribale, sourceY, SourceX, sourceWidth, sourceHeight, canvasX, canvasY, finalWidth, finalHeight)
  //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
  //you only need the extra four source arguments if you want to display just a portion of the picture; if you want to show the whole picture you can just do drawImage(imageVar, canvasX, canvasY, width, height)

  //next section draws hallie. There is an if so that the image is reversed based on the direction of travel
  //there is also a hitDx and hitDy; those are offsets for the animation; enable debugger to see the true hitbox in green
  //you can enable the debug view by uncommenting the debug() function call in the main function.
  if (player.deadAndDeathAnimationDone) {
    return; //return stops the function, we don't want to draw the robot after we die
  }

  if (player.facingRight) {
    ctx.drawImage(
      halleImage,
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight,
      player.x - hitDx,
      player.y - hitDy,
      player.width,
      player.height
    );
  } else {
    //for running to the left you mirror the image
    ctx.save();
    ctx.scale(-1, 1); //mirror the entire canvas
    ctx.drawImage(
      halleImage,
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight,
      -player.x - player.width + hitDx,
      player.y - hitDy,
      player.width,
      player.height
    );
    ctx.restore(); //put the canvas back to normal
  }
}

function collision() {
  player.onGround = false; // Reset this every frame; if the player is actually on the ground, the resolveCollision function will set it to true
  var result = undefined;
  for (var i = 0; i < platforms.length; i++) {
    // Check for collision
    if (
      player.x + hitBoxWidth > platforms[i].x &&
      player.x < platforms[i].x + platforms[i].width &&
      player.y < platforms[i].y + platforms[i].height &&
      player.y + hitBoxHeight > platforms[i].y
    ) {
      //now that we know we have collided, we figure out the direction of collision
      result = resolveCollision(
        platforms[i].x,
        platforms[i].y,
        platforms[i].width,
        platforms[i].height
      );
    }
  }
  return result;
}

function resolveCollision(objx, objy, objw, objh) {
  //this is the return value
  let collisionDirection = "";
  //found here https://stackoverflow.com/questions/38648693/resolve-collision-of-two-2d-elements
  //first we find the distance between the center of the object and the player
  let dx = player.x + hitBoxWidth / 2 - (objx + objw / 2);
  let dy = player.y + hitBoxHeight / 2 - (objy + objh / 2);

  //get half-widths of each item
  let halfWidth = hitBoxWidth / 2 + objw / 2;
  let halfHeight = hitBoxHeight / 2 + objh / 2;

  // if the x and y vector are less than the half width or half height,
  // then we must be inside the object, causing a collision
  let originx = halfWidth - Math.abs(dx);
  let originy = halfHeight - Math.abs(dy);

  if (debugVar) {
    //debug
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(objx + dx, objy);
    ctx.lineTo(objx, objy);
    ctx.lineTo(objx, objy + dy);
    ctx.stroke();
    ctx.fillStyle = "rbga(252,186,3,.3)";
    ctx.fillRect(player.x, player.y, hitBoxWidth, hitBoxHeight);
  }

  if (originx >= originy) {
    if (dy > 0) {
      //bottom collision
      collisionDirection = "bottom";
      player.y = player.y + originy + 1;
      player.speedY = 0;
    } else {
      //top collision
      collisionDirection = "top";
      player.y = player.y - originy;
      player.speedY = 0;
      player.onGround = true;
    }
  } else {
    if (dx > 0) {
      //left collision
      collisionDirection = "left";
      player.x = player.x + originx;
      player.speedX = 0;
    } else {
      //right collision
      collisionDirection = "right";
      player.x = player.x - originx;
      player.speedX = 0;
    }
  }

  return collisionDirection;
}

function projectileCollision() {
  //checking if the player is dead
  if (currentAnimationType === animationTypes.frontDeath) {
    return;
  }

  if (player.onGround) {
    player.doubleJumpUsed = false;
  }

  for (var i = 0; i < projectiles.length; i++) {
    //this deletes any projectiles that go off the screen
    if (
      projectiles[i].x > canvas.width + 100 + projectiles[i].width ||
      projectiles[i].x < -100 - projectiles[i].width ||
      projectiles[i].y > canvas.height + 100 + projectiles[i].height ||
      projectiles[i].y < -100 - projectiles[i].height
    ) {
      projectiles.splice(i, 1);
    }

    if (i === projectiles.length) {
      return;
    }

    //collision with the player
    if (
      !player.shieldActive &&
      projectiles[i].x < player.x + hitBoxWidth &&
      projectiles[i].x + projectiles[i].width > player.x &&
      projectiles[i].y < player.y + hitBoxHeight &&
      projectiles[i].y + projectiles[i].height > player.y
    ) {
      currentAnimationType = animationTypes.frontDeath;
      frameIndex = 0;
    }
  }
}

function badPlatformCollision() {
  if (currentAnimationType === animationTypes.frontDeath || player.shieldActive) {
    return;
  }
  for (var i = 0; i < badPlatforms.length; i++) {
    if (
      player.x + hitBoxWidth > badPlatforms[i].x &&
      player.x < badPlatforms[i].x + badPlatforms[i].width &&
      player.y < badPlatforms[i].y + badPlatforms[i].height &&
      player.y + hitBoxHeight > badPlatforms[i].y
    ) {
      currentAnimationType = animationTypes.frontDeath;
      frameIndex = 0;
    }
  }
}

function deathOfPlayer() {
  ctx.fillStyle = "grey";
  ctx.fillRect(
    canvas.width / 4,
    canvas.height / 6,
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.fillStyle = "black";
  ctx.font = "800% serif";
  ctx.fillText(
    "You are dead",
    canvas.width / 4,
    canvas.height / 6 + canvas.height / 5,
    (canvas.width / 16) * 14
  );
  ctx.font = "500% serif";
  ctx.fillText(
    "Hit any key to restart",
    canvas.width / 4,
    canvas.height / 6 + canvas.height / 3,
    (canvas.width / 16) * 14
  );
  if (keyPress.any) {
    keyPress.any = false;
    window.location.reload();
  }
}

function playerFrictionAndGravity() {
  if (player.speedBoostFrames > 0) {
    player.speedBoostFrames--;
  }
  if (player.powerModeFrames > 0) {
    player.powerModeFrames--;
    if (player.powerModeFrames === 0) {
      player.doubleJumpAvailable = false;
      player.doubleJumpUsed = false;
      player.shieldActive = false;
    }
  }
  //max speed limiter for ground
  var currentMaxSpeed = player.speedBoostFrames > 0 ? maxSpeed * 1.75 : maxSpeed;
  if (player.speedX > currentMaxSpeed) {
    player.speedX = currentMaxSpeed;
  } else if (player.speedX < -currentMaxSpeed) {
    player.speedX = -currentMaxSpeed;
  }
  //friction
  if (Math.abs(player.speedX) < 1) {
    //this makes sure that the player actually stops when the speed gets low enough
    //otherwise if you just always reduce speed it will just end up jiggling
    player.speedX = 0;
  } else if (player.speedX > 0) {
    player.speedX = player.speedX - friction;
  } else {
    player.speedX = player.speedX + friction;
  }

  if (player.onGround === false) {
    player.speedY = player.speedY + gravity;
  }
}

function drawPacmanBackground() {
  ctx.fillStyle = "#080d2b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(43, 103, 214, 0.42)";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 42, canvas.width - 36, canvas.height - 68);
  ctx.beginPath();
  ctx.moveTo(18, 180);
  ctx.lineTo(280, 180);
  ctx.lineTo(280, 300);
  ctx.lineTo(520, 300);
  ctx.moveTo(600, 42);
  ctx.lineTo(600, 170);
  ctx.lineTo(840, 170);
  ctx.lineTo(840, 42);
  ctx.moveTo(1060, 180);
  ctx.lineTo(1320, 180);
  ctx.lineTo(1320, 300);
  ctx.lineTo(1080, 300);
  ctx.stroke();

  ctx.fillStyle = "#ffe66d";
  for (var dotX = 48; dotX < canvas.width - 30; dotX += 42) {
    for (var dotY = 80; dotY < canvas.height - 25; dotY += 42) {
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function startAudio() {
  if (!audioContext) {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playSound(kind) {
  if (!audioContext) {
    return;
  }
  var settings = {
    collect: { frequency: 660, duration: 0.12, type: "square" },
    pellet: { frequency: 880, duration: 0.06, type: "sine" },
    explode: { frequency: 110, duration: 0.2, type: "sawtooth" },
  }[kind];
  if (!settings) {
    return;
  }
  var oscillator = audioContext.createOscillator();
  var gain = audioContext.createGain();
  oscillator.type = settings.type;
  oscillator.frequency.value = settings.frequency;
  gain.gain.setValueAtTime(0.06, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + settings.duration
  );
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + settings.duration);
}

function drawIntro() {
  drawPacmanBackground();
  var pulse = 0.65 + Math.sin(gameFrame * 0.08) * 0.2;
  ctx.textAlign = "center";
  ctx.font = "700 28px Trebuchet MS";
  ctx.fillStyle = "#fff4c2";
  ctx.fillText("Made by Ayden", canvas.width / 2, 165);
  ctx.font = "700 42px Trebuchet MS";
  ctx.fillText("The", canvas.width / 2, 230);
  ctx.shadowColor = "rgba(255, 27, 55, " + pulse + ")";
  ctx.shadowBlur = 24;
  ctx.font = "900 92px Impact";
  ctx.fillStyle = "#ff304f";
  ctx.fillText("IMPOSSIBLE", canvas.width / 2, 330);
  ctx.shadowBlur = 0;
  ctx.font = "700 54px Trebuchet MS";
  ctx.fillStyle = "#ffe66d";
  ctx.fillText("Parkour", canvas.width / 2, 405);

  for (var flame = 0; flame < 18; flame++) {
    var flameX = canvas.width / 2 - 390 + flame * 46;
    var flameHeight = 18 + ((gameFrame * 3 + flame * 17) % 25);
    ctx.fillStyle = flame % 2 === 0 ? "#ff304f" : "#ff9f1c";
    ctx.beginPath();
    ctx.moveTo(flameX, 350);
    ctx.lineTo(flameX + 15, 350 - flameHeight);
    ctx.lineTo(flameX + 30, 350);
    ctx.fill();
  }

  ctx.font = "600 20px Trebuchet MS";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Press any key to enter the maze", canvas.width / 2, 525);
  ctx.textAlign = "left";
}

function drawScoreHud() {
  ctx.fillStyle = "rgba(8, 13, 43, 0.88)";
  ctx.fillRect(18, 8, 390, 30);
  ctx.font = "600 16px Trebuchet MS";
  ctx.fillStyle = "#ffe66d";
  ctx.fillText("SCORE " + score, 32, 29);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(
    "COLLECTIONS " + collectables.filter(function (item) { return item.collected; }).length + "/" + collectables.length,
    155,
    29
  );
  ctx.fillStyle = "#ff9f1c";
  ctx.fillText("PELLETS " + pellets.filter(function (pellet) { return pellet.collected; }).length + "/" + pellets.length, 315, 29);
}

function drawPowerCubes() {
  for (var i = 0; i < powerCubes.length; i++) {
    var cube = powerCubes[i];
    if (cube.collected) {
      continue;
    }
    ctx.save();
    ctx.translate(cube.x, cube.y);
    ctx.rotate(cube.rotation);
    ctx.fillStyle = "#ff9f1c";
    ctx.strokeStyle = "#fff4c2";
    ctx.lineWidth = 3;
    ctx.fillRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size);
    ctx.strokeRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 22px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("?", 0, 8);
    ctx.restore();
    cube.rotation += 0.04;
  }
  ctx.textAlign = "left";
}

function drawPowerGamble() {
  var options = ["SPEED BOOST", "DOUBLE JUMP", "SHIELD", "RAINBOW MODE"];
  var optionColors = ["#ff9f1c", "#4dd4ff", "#7dff8a", "#ff4de1"];
  gambleElapsed++;
  if (gambleElapsed >= gambleNextChange && gambleElapsed < 120) {
    gambleRollIndex = (gambleRollIndex + 1) % options.length;
    gambleNextChange = gambleElapsed + gambleInterval;
    gambleInterval = Math.min(18, gambleInterval * 1.18);
  }
  var resultIndex = options.indexOf(powerUpLabel(gambleResult));
  var displayIndex = gambleElapsed >= 120 ? resultIndex : gambleRollIndex;

  ctx.fillStyle = "rgba(8, 13, 43, 0.94)";
  ctx.fillRect(250, 135, 900, 430);
  ctx.strokeStyle = optionColors[displayIndex];
  ctx.lineWidth = 8;
  ctx.strokeRect(250, 135, 900, 430);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 48px Impact";
  ctx.fillText("POWER-UP ROLL", canvas.width / 2, 220);
  ctx.font = "700 24px Trebuchet MS";
  ctx.fillStyle = "#ffe66d";
  ctx.fillText("LUCKY BLOCK ACTIVATED", canvas.width / 2, 265);
  ctx.fillStyle = optionColors[displayIndex];
  ctx.font = "900 58px Trebuchet MS";
  ctx.fillText(options[displayIndex], canvas.width / 2, 380);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 20px Trebuchet MS";
  ctx.fillText(gambleElapsed >= 120 ? "POWER-UP LOCKED IN!" : "ROLLING...", canvas.width / 2, 455);
  ctx.textAlign = "left";

  gambleFrames--;
  if (gambleFrames <= 0) {
    gambleActive = false;
    applyPowerUp(gambleResult);
  }
}

function powerUpLabel(type) {
  return {
    speed: "SPEED BOOST",
    double: "DOUBLE JUMP",
    shield: "SHIELD",
    rainbow: "RAINBOW MODE",
  }[type];
}

function createPowerCube(x, y) {
  powerCubes.push({
    x: x,
    y: y,
    size: 34,
    rotation: 0,
    collected: false,
  });
}

function applyPowerUp(type) {
  var duration = frameRate * 10;
  if (type === "speed" || type === "rainbow") {
    player.speedBoostFrames = duration;
  }
  if (type === "double" || type === "rainbow") {
    player.doubleJumpAvailable = true;
    player.doubleJumpUsed = false;
    player.powerModeFrames = duration;
  }
  if (type === "shield" || type === "rainbow") {
    player.shieldActive = true;
    player.powerModeFrames = duration;
  }
  playSound("collect");
}

function powerCubesCollide() {
  for (var i = 0; i < powerCubes.length; i++) {
    var cube = powerCubes[i];
    if (
      !cube.collected &&
      cube.x > player.x - cube.size &&
      cube.x < player.x + hitBoxWidth + cube.size &&
      cube.y > player.y - cube.size &&
      cube.y < player.y + hitBoxHeight + cube.size
    ) {
      cube.collected = true;
      var types = ["speed", "double", "shield", "rainbow"];
      gambleResult = types[Math.floor(Math.random() * types.length)];
      gambleFrames = 150;
      gambleElapsed = 0;
      gambleNextChange = 0;
      gambleInterval = 2;
      gambleRollIndex = Math.floor(Math.random() * types.length);
      gambleActive = true;
      score += 50;
    }
  }
}

function drawBarrageWarning() {
  var warningPulse = 0.72 + Math.sin(gameFrame * 0.32) * 0.2;
  ctx.fillStyle = "rgba(150, 0, 20, " + warningPulse + ")";
  ctx.fillRect(130, 125, canvas.width - 260, 180);
  ctx.strokeStyle = "#ffe66d";
  ctx.lineWidth = 6;
  ctx.strokeRect(130, 125, canvas.width - 260, 180);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 46px Impact";
  ctx.fillText(
    barrageWarningActive ? "CANNON BARRAGE INCOMING" : "CANNON BARRAGE",
    canvas.width / 2,
    185
  );
  ctx.fillStyle = "#ffe66d";
  ctx.font = "900 32px Trebuchet MS";
  ctx.fillText("HIDE UNDER A PLATFORM NOW!", canvas.width / 2, 240);
  ctx.font = "700 18px Trebuchet MS";
  var warningEndFrame = barrageWarningActive
    ? barrageWarningEndFrame
    : barrageEndFrame;
  var warningLabel = barrageWarningActive ? "SHOOTING IN " : "BARRAGE ENDS IN ";
  ctx.fillText(
    warningLabel + Math.ceil((warningEndFrame - gameplayFrame) / frameRate),
    canvas.width / 2,
    278
  );
  ctx.textAlign = "left";
}

function updateCannonBarrage() {
  if (
    !barrageWarningActive &&
    !barrageActive &&
    gameplayFrame > 0 &&
    gameplayFrame >= nextBarrageFrame
  ) {
    barrageWarningActive = true;
    barrageWarningEndFrame = gameplayFrame + frameRate * 3;
    projectiles = [];
    playSiren();
  } else if (
    barrageWarningActive &&
    gameplayFrame >= barrageWarningEndFrame
  ) {
    barrageWarningActive = false;
    barrageActive = true;
    barrageEndFrame = gameplayFrame + frameRate * 3;
    barrageCannonCount = cannons.length;
    cannons = cannons.concat(cannons.map(function (cannon) {
      var extraCannon = Object.assign({}, cannon);
      extraCannon.projectileCountdown = 0;
      extraCannon.x += 24;
      extraCannon.y += 24;
      return extraCannon;
    }));
    playSiren();
  } else if (barrageActive && gameplayFrame >= barrageEndFrame) {
    barrageActive = false;
    cannons = cannons.slice(0, barrageCannonCount);
    nextBarrageFrame = gameplayFrame + frameRate * 5 + Math.floor(Math.random() * (frameRate * 10));
  }
}

function playSiren() {
  if (!audioContext) {
    return;
  }
  var oscillator = audioContext.createOscillator();
  var gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(260, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(920, audioContext.currentTime + 0.35);
  oscillator.frequency.linearRampToValueAtTime(260, audioContext.currentTime + 0.7);
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1.2);
}

function drawPellets() {
  for (var i = 0; i < pellets.length; i++) {
    if (pellets[i].collected) {
      continue;
    }
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pellets[i].x, pellets[i].y, 6 + Math.sin(gameFrame * 0.1) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (var i = 0; i < platforms.length; i++) {
    // Check if platform should move horizontally
    if (platforms[i].minX !== null && platforms[i].maxX !== null) {
      // Move platform based on speed and direction
      platforms[i].x += platforms[i].speedX * platforms[i].directionX;

      // Reverse direction if platform reaches minX or maxX bounds
      if (platforms[i].x < platforms[i].minX) {
        platforms[i].x = platforms[i].minX;
        platforms[i].directionX *= -1; // Change direction to right
      } else if (platforms[i].x > platforms[i].maxX) {
        platforms[i].x = platforms[i].maxX;
        platforms[i].directionX *= -1; // Change direction to left
      }
    }

    // Check if platform should move vertically
    if (platforms[i].minY !== null && platforms[i].maxY !== null) {
      // Move platform based on speed and direction
      platforms[i].y += platforms[i].speedY * platforms[i].directionY;
      // Reverse direction if platform reaches minY or maxY bounds
      if (platforms[i].y < platforms[i].minY) {
        platforms[i].y = platforms[i].minY;
        platforms[i].directionY *= -1; // Change direction to down
      } else if (platforms[i].y > platforms[i].maxY) {
        platforms[i].y = platforms[i].maxY;
        platforms[i].directionY *= -1; // Change direction to up
      }
    }

    // Draw the platform
    const { color, x, y, width, height } = platforms[i];
    ctx.fillStyle = platforms[i].colorCycle
      ? "hsl(" + ((gameFrame * 2 + i * 45) % 360) + ", 82%, 58%)"
      : color;
    ctx.fillRect(x, y, width, height);
  }
}

function drawFakePlatforms() {
  for (var i = 0; i < fakePlatforms.length; i++) {
    const { color, x, y, width, height } = fakePlatforms[i];
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
}

function drawBadPlatforms() {
  for (var i = 0; i < badPlatforms.length; i++) {
    const { color, x, y, width, height } = badPlatforms[i];
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
}

function toggleGrid() {
  shouldDrawGrid = true;
}

function makeGrid() {
  // vertical grid lines
  for (let i = 100; i < canvas.width; i += 100) {
    if (!gridMade) {
      createFakePlatform(i - 1, 35, 1, canvas.height);
    }
    // add text indicating x value at top of game
    ctx.font = "125% serif";
    ctx.fillStyle = "black";
    ctx.fillText(
      i, // text
      i - 15, // x location
      25 // y location
    );
  }

  // horizontal grid lines
  for (let i = 100; i < canvas.height; i += 100) {
    if (!gridMade) {
      createFakePlatform(45, i - 1, canvas.width, 1);
    }
    // add text indicating y value at left side of game
    ctx.font = "125% serif";
    ctx.fillText(
      i, // text
      10, // x location
      i + 5 // y location
    );
  }
  gridMade = true;
}

function drawProjectiles() {
  for (var i = 0; i < projectiles.length; i++) {
    var projectile = projectiles[i];

    if (projectile.exploding) {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(
        projectile.x + projectile.width / 2,
        projectile.y + projectile.height / 2,
        projectile.explosionRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      projectile.explosionFrames--;
      if (projectile.explosionFrames <= 0) {
        projectiles.splice(i, 1);
        i--;
      }
      continue;
    }

    if (projectile.isTracking) {
      var targetX = player.x + hitBoxWidth / 2 - projectile.x;
      var targetY = player.y + hitBoxHeight / 2 - projectile.y;
      var targetDistance = Math.sqrt(targetX * targetX + targetY * targetY);
      var projectileVelocity = Math.sqrt(
        projectile.speedX * projectile.speedX +
          projectile.speedY * projectile.speedY
      );
      if (targetDistance > 0) {
        projectile.speedX = (targetX / targetDistance) * projectileVelocity;
        projectile.speedY = (targetY / targetDistance) * projectileVelocity;
      }
      projectile.fuseFrames--;
      if (projectile.fuseFrames <= 0) {
        projectile.exploding = true;
        projectile.explosionFrames = 18;
        projectile.explosionRadius = 24;
        playSound("explode");
        continue;
      }
    }

    var nextX = projectile.x + projectile.speedX;
    var nextY = projectile.y + projectile.speedY;
    var bounced = false;

    for (var platformIndex = 0; platformIndex < platforms.length; platformIndex++) {
      var platform = platforms[platformIndex];
      var overlapsPlatform =
        nextX < platform.x + platform.width &&
        nextX + projectile.width > platform.x &&
        nextY < platform.y + platform.height &&
        nextY + projectile.height > platform.y;

      if (!overlapsPlatform) {
        continue;
      }

      if (projectile.bounceCount >= 6 || Math.random() >= 0.2) {
        projectile.exploding = true;
        projectile.explosionFrames = 18;
        projectile.explosionRadius = 24;
        playSound("explode");
        bounced = true;
        break;
      }

      var hitFromSide =
        projectile.x + projectile.width <= platform.x &&
        nextX + projectile.width > platform.x;
      var hitFromOtherSide =
        projectile.x >= platform.x + platform.width &&
        nextX < platform.x + platform.width;
      var hitFromAbove =
        projectile.y + projectile.height <= platform.y &&
        nextY + projectile.height > platform.y;
      var hitFromBelow =
        projectile.y >= platform.y + platform.height &&
        nextY < platform.y + platform.height;

      if (hitFromSide || hitFromOtherSide) {
        projectile.speedX *= -1;
        projectile.x = hitFromSide
          ? platform.x - projectile.width
          : platform.x + platform.width;
      } else if (hitFromAbove || hitFromBelow) {
        projectile.speedY *= -1;
        projectile.y = hitFromAbove
          ? platform.y - projectile.height
          : platform.y + platform.height;
      } else {
        projectile.speedX *= -1;
        projectile.speedY *= -1;
      }

      projectile.bounceCount++;
      nextX = projectile.x + projectile.speedX;
      nextY = projectile.y + projectile.speedY;
      bounced = true;
      break;
    }

    if (!bounced) {
      projectile.x = nextX;
      projectile.y = nextY;
    }

    if (projectiles[i] === projectile) {
      if (projectile.exploding) {
        continue;
      }
      ctx.drawImage(
        projectileImage,
        projectile.x,
        projectile.y,
        projectile.width,
        projectile.height
      );
    }
  }
}

function drawCannons() {
  for (var i = 0; i < cannons.length; i++) {
    var shotInterval = barrageActive ? 3 : cannons[i].timeBetweenShots;
    if (
      !barrageWarningActive &&
      cannons[i].projectileCountdown >= shotInterval
    ) {
      cannons[i].projectileCountdown = 0;
      createProjectile(
        cannons[i].location,
        cannons[i].x,
        cannons[i].y,
        cannons[i].projectileWidth,
        cannons[i].projectileHeight
      );
      if (barrageActive) {
        projectiles[projectiles.length - 1].isTracking = false;
      }
      if (barrageActive) {
        var barrageProjectile = projectiles[projectiles.length - 1];
        barrageProjectile.speedX *= 2.5;
        barrageProjectile.speedY *= 2.5;
      }
    } else {
      cannons[i].projectileCountdown = cannons[i].projectileCountdown + 1;
    }

    // move cannon if minX and maxX are set
    if (cannons[i].minX !== null && cannons[i].maxX !== null) {
      cannons[i].x += cannons[i].speedX;
      if (cannons[i].x < cannons[i].minX || cannons[i].x > cannons[i].maxX) {
        cannons[i].speedX *= -1;
      }
    }
    // move cannon if minY and maxY are set
    if (cannons[i].minY !== null && cannons[i].maxY !== null) {
      cannons[i].y += cannons[i].speedY;
      if (cannons[i].y < cannons[i].minY || cannons[i].y > cannons[i].maxY) {
        cannons[i].speedY *= -1;
      }
    }

    ctx.fillStyle = "grey";
    ctx.save(); //save the current translation of the screen.
    ctx.translate(cannons[i].x, cannons[i].y); //you are moving the top left of the screen to the pictures location, this is because you can't rotate the image, you have to rotate the whole page
    ctx.rotate((cannons[i].rotation * Math.PI) / 180); //then you rotate. rotation is centered on 0,0 on the canvas, which is why we moved the picture to 0,0 with translate(x,y)
    ctx.drawImage(cannonImage, 0, 0, cannonWidth, cannonHeight); //you draw the image on the rotated canvas. as of this line, the picture is straight and the rest of the page is rotated
    //also the previous line uses -width / 2 so that the picture is centered. This will mean that (0,0) is at the exact center of the image
    ctx.translate(-cannons[i].x, -cannons[i].y); //the reverse of the previous translate, this moves the page back to the correct place so that the image is no longer at (0,0)
    ctx.restore(); //this unrotates the canvas so the canvas is straight, but now since you did that the picture looks rotated
  }
}

function drawCollectables() {
  for (var i = 0; i < collectables.length; i++) {
    if (collectables[i].collected !== true) {
      //draw on screen if not collected
      ctx.drawImage(
        collectables[i].image,
        collectables[i].x,
        collectables[i].y,
        collectableWidth,
        collectableHeight
      );
    } else {
      //draw the icons at the top if collected
      if (collectables[i].alpha > 0.4) {
        collectables[i].alpha = collectables[i].alpha - 0.007;
      }
      ctx.globalAlpha = collectables[i].alpha;
      ctx.drawImage(
        collectables[i].image,
        200 + 100 * i,
        10,
        collectableWidth,
        collectableHeight
      );
      ctx.globalAlpha = 1;
    }

    // Horizontal movement logic for collectables
    if (collectables[i].minX !== null && collectables[i].maxX !== null) {
      // Move collectable based on speed and direction
      collectables[i].x += collectables[i].speed * collectables[i].direction;

      // Reverse direction if collectable reaches minX or maxX bounds
      if (collectables[i].x < collectables[i].minX) {
        collectables[i].x = collectables[i].minX;
        collectables[i].direction *= -1; // Change direction to right
      } else if (collectables[i].x > collectables[i].maxX) {
        collectables[i].x = collectables[i].maxX;
        collectables[i].direction *= -1; // Change direction to left
      }
    }

    //gravity
    collectables[i].speedY = collectables[i].speedY + collectables[i].gravity;
    collectables[i].y = collectables[i].y + collectables[i].speedY;

    // Check for collision with platforms in order to bounce
    for (var j = 0; j < platforms.length; j++) {
      if (
        collectables[i].x + collectableWidth > platforms[j].x &&
        collectables[i].x < platforms[j].x + platforms[j].width &&
        collectables[i].y < platforms[j].y + platforms[j].height &&
        collectables[i].y + collectableHeight > platforms[j].y
      ) {
        //bottom of collectable is below top of platform
        collectables[i].y = collectables[i].y - collectables[i].speedY;
        collectables[i].speedY *= -collectables[i].bounce;
      }
    }
  }
}

function collectablesCollide() {
  for (var i = 0; i < collectables.length; i++) {
    if (
      collectables[i].x + collectableWidth > player.x &&
      collectables[i].x < player.x + hitBoxWidth &&
      collectables[i].y < player.y + hitBoxHeight &&
      collectables[i].y + collectableHeight > player.y
    ) {
      if (!collectables[i].collected) {
        collectables[i].collected = true;
        score += 100;
        playSound("collect");
      }
      checkForWin();
    }
  }
}

function pelletsCollide() {
  for (var i = 0; i < pellets.length; i++) {
    if (
      !pellets[i].collected &&
      pellets[i].x > player.x - 8 &&
      pellets[i].x < player.x + hitBoxWidth + 8 &&
      pellets[i].y > player.y - 8 &&
      pellets[i].y < player.y + hitBoxHeight + 8
    ) {
      pellets[i].collected = true;
      score += 10;
      playSound("pellet");
    }
  }
}

function checkForWin() {
  if (collectables.length === 0) {
    return; // If there are no collectables, we can't win
  }
  for (var i = 0; i < collectables.length; i++) {
    if (collectables[i].collected !== true) {
      return; // If any collectable is not collected, we can't win yet
    }
  }
  player.winConditionMet = true; // Set win condition to true
}

function winGame() {
  drawPacmanBackground();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe66d";
  ctx.font = "900 64px Impact";
  ctx.fillText("IMPOSSIBLE PARKOUR", canvas.width / 2, 245);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Trebuchet MS";
  ctx.fillText("You beat the impossible parkour game!", canvas.width / 2, 320);
  ctx.fillStyle = "#ff9f1c";
  ctx.font = "600 26px Trebuchet MS";
  ctx.fillText("Final score: " + score, canvas.width / 2, 380);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 20px Trebuchet MS";
  ctx.fillText("Press R to run it again", canvas.width / 2, 470);
  ctx.textAlign = "left";
  if (keyPress.any) {
    keyPress.any = false;
    resetGame();
  }
}

function createPlatform(
  x,
  y,
  width,
  height,
  color = "grey",
  minX = null,
  maxX = null,
  speedX = 1,
  minY = null,
  maxY = null,
  speedY = 1
) {
  platforms.push({
    x,
    y,
    width,
    height,
    color,
    minX,
    maxX,
    speedX,
    minY,
    maxY,
    speedY,
    directionX: 1, // 1 for right, -1 for left
    directionY: 1, // 1 for down, -1 for up
    colorCycle: minX !== null || minY !== null,
  });
}

function createPellet(x, y) {
  pellets.push({ x, y, collected: false });
}

function createFakePlatform(x, y, width, height, color = "grey") {
  fakePlatforms.push({
    x,
    y,
    width,
    height,
    color,
  });
}

function createBadPlatform(x, y, width, height, color = "red") {
  badPlatforms.push({
    x,
    y,
    width,
    height,
    color,
  });
}

function createCannon(
  wallLocation,
  position,
  timeBetweenShots,
  width = defaultProjectileWidth,
  height = defaultProjectileHeight,
  minPos = null,
  maxPos = null,
  speed = 1
) {
  if (wallLocation === "top") {
    cannons.push({
      x: position,
      y: cannonHeight,
      rotation: 180,
      projectileCountdown: 0,
      location: wallLocation,
      timeBetweenShots: timeBetweenShots / (1000 / frameRate),
      projectileWidth: width,
      projectileHeight: height,
      minX: minPos,
      maxX: maxPos,
      speedX: speed,
      minY: null,
      maxY: null,
      speedY: 0,
    });
  } else if (wallLocation === "bottom") {
    cannons.push({
      x: position,
      y: canvas.height - cannonHeight,
      rotation: 0,
      projectileCountdown: 0,
      location: wallLocation,
      timeBetweenShots: timeBetweenShots / (1000 / frameRate),
      projectileWidth: width,
      projectileHeight: height,
      minX: minPos,
      maxX: maxPos,
      speedX: speed,
      minY: null,
      maxY: null,
      speedY: 0,
    });
  } else if (wallLocation === "left") {
    cannons.push({
      x: cannonHeight,
      y: position,
      rotation: 90,
      projectileCountdown: 0,
      location: wallLocation,
      timeBetweenShots: timeBetweenShots / (1000 / frameRate),
      projectileWidth: width,
      projectileHeight: height,
      minX: null,
      maxX: null,
      speedX: 0,
      minY: minPos,
      maxY: maxPos,
      speedY: speed,
    });
  } else if (wallLocation === "right") {
    cannons.push({
      x: canvas.width - cannonHeight,
      y: position,
      rotation: 270,
      projectileCountdown: 0,
      location: wallLocation,
      timeBetweenShots: timeBetweenShots / (1000 / frameRate),
      projectileWidth: width,
      projectileHeight: height,
      minX: null,
      maxX: null,
      speedX: 0,
      minY: minPos,
      maxY: maxPos,
      speedY: speed,
    });
  }
}

function createCollectable(
  type,
  x,
  y,
  gravity = 0,
  bounce = 1,
  minX = null,
  maxX = null,
  speed = 1
) {
  if (type !== "") {
    var image = document.createElement("img");
    image.src = collectableList[type].image;
    image.id = "image" + collectables.length;
    collectables.push({
      image,
      x,
      y,
      speedY: 0,
      collected: false,
      alpha: 2,
      gravity,
      bounce,
      minX,
      maxX,
      speed,
      direction: 1, // 1 for right, -1 for left
    });
  }
}

function createProjectile(wallLocation, x, y, width, height) {
  //checking if the player is dead
  if (currentAnimationType === animationTypes.frontDeath) {
    return;
  }

  if (wallLocation === "top") {
    projectiles.push({
      x: x - 71.5,
      y: y - 55 - height / 2,
      speedX: 0,
      speedY: projectileSpeed,
      width,
      height,
      bounceCount: 0,
      isTracking: Math.random() < 0.2,
      fuseFrames: 180,
      exploding: false,
      explosionFrames: 0,
      explosionRadius: 0,
    });
  } else if (wallLocation === "bottom") {
    projectiles.push({
      x: x + 47,
      y: y + 50 + height / 2,
      speedX: 0,
      speedY: -projectileSpeed,
      width,
      height,
      bounceCount: 0,
      isTracking: Math.random() < 0.2,
      fuseFrames: 180,
      exploding: false,
      explosionFrames: 0,
      explosionRadius: 0,
    });
  } else if (wallLocation === "left") {
    projectiles.push({
      x: x - 80 - width / 2,
      y: y + 46,
      speedX: projectileSpeed,
      speedY: 0,
      width,
      height,
      bounceCount: 0,
      isTracking: Math.random() < 0.2,
      fuseFrames: 180,
      exploding: false,
      explosionFrames: 0,
      explosionRadius: 0,
    });
  } else if (wallLocation === "right") {
    projectiles.push({
      x: x + 40 + width / 2,
      y: y - 71.5,
      speedX: -projectileSpeed,
      speedY: 0,
      width,
      height,
      bounceCount: 0,
      isTracking: Math.random() < 0.2,
      fuseFrames: 180,
      exploding: false,
      explosionFrames: 0,
      explosionRadius: 0,
    });
  }

  // putting this here instead of in every if
  projectiles[projectiles.length - 1].x -= (width - defaultProjectileWidth) / 2;
  projectiles[projectiles.length - 1].y -=
    (height - defaultProjectileHeight) / 2;
}

function keyboardControlActions() {
  var jumpHeld = keyPress.space || keyPress.up;
  var jumpPressed = jumpHeld && !jumpKeyWasDown;
  jumpKeyWasDown = jumpHeld;
  keyPress.any = false; //keyboardHandler will set this to true if you press any key. Setting the variable to false here makes sure that key press dosen't stick around.
  //this is used for respawning; if you hit any key after you die this variable will be set to true and you will respawn.

  if (currentAnimationType === animationTypes.frontDeath) {
    return;
  }

  if (keyPress.left) {
    player.speedX -= walkAcceleration;
    player.facingRight = false;
  }
  if (keyPress.right) {
    player.speedX += walkAcceleration;
    player.facingRight = true;
  }
  if (player.onGround && (jumpPressed || jumpBufferFrames > 0)) {
      //this only lets you jump if you are on the ground
      player.speedY = player.speedY - playerJumpStrength;
      jumpTimer = 19; //this counts how many frames to have the jump last.
      player.onGround = false; //bug fix for jump animation, you have to change this or the jump animation doesn't work
      frameIndex = 4;
      jumpBufferFrames = 0;
  } else if (
    jumpPressed &&
    player.doubleJumpAvailable &&
    player.powerModeFrames > 0 &&
    !player.doubleJumpUsed
  ) {
    player.speedY = -playerJumpStrength;
    player.doubleJumpUsed = true;
    jumpTimer = 19;
    frameIndex = 4;
  }

  if (jumpBufferFrames > 0) {
    jumpBufferFrames--;
  }
}

function handleKeyDown(e) {
  startAudio();
  if (introActive) {
    introActive = false;
    playSound("collect");
  }
  keyPress.any = true;
  if (e.key === "ArrowUp" || e.key === "w") {
    jumpBufferFrames = 8;
    keyPress.up = true;
  }
  if (e.key === "ArrowLeft" || e.key === "a") {
    keyPress.left = true;
  }
  if (e.key === "ArrowDown" || e.key === "s") {
    keyPress.down = true;
  }
  if (e.key === "ArrowRight" || e.key === "d") {
    keyPress.right = true;
  }
  if (e.key === " ") {
    jumpBufferFrames = 8;
    keyPress.space = true;
  }
}

function handleKeyUp(e) {
  if (e.key === "ArrowUp" || e.key === "w") {
    keyPress.up = false;
  }
  if (e.key === "ArrowLeft" || e.key === "a") {
    keyPress.left = false;
  }
  if (e.key === "ArrowDown" || e.key === "s") {
    keyPress.down = false;
    if (currentAnimationType === animationTypes.duck) {
      duckTimer = 8;
      frameIndex = 20;
    }
  }
  if (e.key === "ArrowRight" || e.key === "d") {
    keyPress.right = false;
  }
  if (e.key === " ") {
    keyPress.space = false;
  }
}

function loadJson() {
  getJSON("halle.json", JsonFunction); //runs this before the setup because of timing things
}

