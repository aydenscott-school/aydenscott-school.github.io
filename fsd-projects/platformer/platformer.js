$(function () {
  // initialize canvas and context when able to
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  window.addEventListener("load", loadJson);

  function resetGame() {
    player.x = 50;
    player.y = 100;
    player.speedX = 0;
    player.speedY = 0;
    player.onGround = false;
    player.facingRight = true;
    player.deadAndDeathAnimationDone = false;
    player.winConditionMet = false;
    player.doubleJumpAvailable = false;
    player.doubleJumpUsed = false;
    player.shieldActive = false;
    player.speedBoostFrames = 0;
    player.powerModeFrames = 0;

    Object.keys(keyPress).forEach(function (key) {
      keyPress[key] = false;
    });
    jumpKeyWasDown = false;
    jumpBufferFrames = 0;
    currentAnimationType = animationTypes.run;
    frameIndex = 0;
    jumpTimer = 0;
    duckTimer = 0;

    platforms = [];
    fakePlatforms = [];
    badPlatforms = [];
    cannons = [];
    projectiles = [];
    collectables = [];
    pellets = [];
    score = 0;
    gridMade = false;
    gameFrame = 0;
    gameplayFrame = 0;
    introActive = true;
    barrageWarningActive = false;
    barrageActive = false;
    barrageWarningEndFrame = 0;
    barrageEndFrame = 0;
    barrageCannonCount = 0;
    nextBarrageFrame = 300 + Math.floor(Math.random() * 301);
    powerCubes = [];
    gambleActive = false;
    gambleFrames = 0;
    gambleResult = "speed";
    gambleElapsed = 0;
    gambleNextChange = 0;
    gambleInterval = 2;
    gambleRollIndex = 0;
    setup();
  }

  function handleResetKey(e) {
    if (e.key.toLowerCase() === "r") {
      resetGame();
    }
  }

  window.resetGame = resetGame;

  function setup() {
    if (firstTimeSetup) {
      halleImage = document.getElementById("player");
      projectileImage = document.getElementById("projectile");
      cannonImage = document.getElementById("cannon");
      $(document).on("keydown", handleKeyDown);
      $(document).on("keyup", handleKeyUp);
      $(document).on("keydown", handleResetKey);
      firstTimeSetup = false;
      //start game
      setInterval(main, 1000 / frameRate);
    }

    // Create walls - do not delete or modify this code
    createPlatform(-50, -50, canvas.width + 100, 50); // top wall
    createPlatform(-50, canvas.height - 10, canvas.width + 100, 200, "rgb(118, 0, 233)"); // bottom wall
    createPlatform(-50, -50, 50, canvas.height + 500); // left wall
    createPlatform(canvas.width, -50, 50, canvas.height + 100); // right wall

    //////////////////////////////////
    // ONLY CHANGE BELOW THIS POINT //
    //////////////////////////////////

    // TODO 1 - Enable the Grid
     toggleGrid();


    createPlatform(300, 630, 150, 15, "black", 250, 520, 0.6);
    createPlatform(650, 500, 150, 15, "red", null, null, 1, 410, 570, 0.45);
    createPlatform(350, 450, 150, 15, "pink", 300, 560, 0.7);
    createPlatform(365, 340, 150, 15, "orange", null, null, 1, 285, 410, 0.5);
    createPlatform(345, 240, 150, 15, "green", 300, 520, 0.5)
    createPlatform(780, 240, 150, 15, "silver", null, null, 1, 180, 310, 0.4)
    createPlatform(1000, 500, 150, 15, "red", 960, 1120, 0.5);
    createPlatform(900, 255, 15, 300)
    createPlatform(1150, 365, 150, 15, "red");
    createPlatform(1120, 50, 15, 200, "red");
    createPlatform(1300, 256, 150, 15, "red");
    createPlatform(1150, 145, 150, 15, "red");

    createPellet(115, 110);
    createPellet(220, 200);
    createPellet(320, 590);
    createPellet(470, 405);
    createPellet(590, 255);
    createPellet(720, 450);
    createPellet(860, 195);
    createPellet(1030, 450);
    createPellet(1210, 315);
    createPellet(1360, 210);

    createPowerCube(180, 600);
    createPowerCube(540, 380);
    createPowerCube(720, 180);
    createPowerCube(1080, 440);
    createPowerCube(1260, 290);





    createCollectable("steve", 1350, 50);
createCollectable("diamond", 200, 170, 0.5, 0.7);
createCollectable("grace", 400, 300, 0.5, 0.7);
createCollectable("database", 800, 400, 0.5, 0.7);
createCollectable("max", 1000, 200, 0.5, 0.7);
createCollectable("kennedi", 1200, 100, 0.5, 0.7);
createCollectable("grace", 1400, 300, 0.5, 0.7);
createCollectable("database", 1240, 400, 0.5, 0.7);
createCollectable("max", 1320, 200, 0.5, 0.7);



    
    createCannon("top", 400, 1500);
    createCannon("top", 800, 1500);
    createCannon("top", 1200, 1500);
    createCannon("top", 1600, 1500);
    createCannon("top", 102, 1500);



    
    
    //////////////////////////////////
    // ONLY CHANGE ABOVE THIS POINT //
    //////////////////////////////////
  }

  registerSetup(setup);
});

