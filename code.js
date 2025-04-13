// Notion de Position par rapport à un point fixe
// C'est une valeur, donc non modifiable
const point = document.getElementById("point");
class Position {
  #x; // Coordonne x de la position
  #y; // Coordonne y de la position

  // Construit une position à partir de 2 nombres
  constructor(x = 0, y = 0) {
    this.#x = x;
    this.#y = y;
  }

  // Acces en lecture aux attributs
  get x() {
    return this.#x;
  }
  get y() {
    return this.#y;
  }

  // Création d'une nouvelle position par translation
  shift(x, y) {
    return new Position(this.#x + x, this.#y + y);
  }

  // Création d'une nouvelle position à partir d'une vitesse et un temps
  move(speed, duration) {
    // Calcule le déplacement de la vitesse en fonction du temps
    let delta = speed.delta(duration);
    // calcule la nouvelle pôsition
    return this.shift(delta.x, delta.y);
  }
}

// Notion de vitesse : nombre de pixels à bouger par secondes
class Speed {
  #x; // distance à parcourir sur l'axe des X en 1 seconde
  #y; // distance à parcourir sur l'axe des Y en 1 seconde
  #max; // Vitesse maximum, doit être positive

  // Indique la vitesse maximum
  constructor(max) {
    if (max <= 0) {
      throw new Error("Vitesse maximum doit être positif");
    }
    this.#x = 1;
    this.#y = 0;
    this.#max = max;
  }

  // Stoppe sur les deux axes
  stop() {
    this.#x = 0;
    this.#y = 0;
  }

  set x(x) {
    this.#x = x;
  }
  set y(y) {
    this.#y = y;
  }

  // Vrai si la vitesse est nulle.
  isStopped() {
    return this.#x == 0 && this.#y == 0;
  }

  // Accelère si dx ou dy est positif ou freine si negatif
  change(dx, dy) {
    this.#x += dx;
    this.#y += dy;
    // console.log(dx, dy, this.#x, this.#y, this);

    // Limite les vitesses
    if (this.#x > this.#max) {
      this.#x = this.#max;
    } else if (this.#x < -this.#max) {
      this.#x = -this.#max;
    }
    if (this.#y > this.#max) {
      this.#y = this.#max;
    } else if (this.#y < -this.#max) {
      this.#y = -this.#max;
    }
  }

  // Calcule un déplacement en x et y à cette vitesse pour un temps donné
  // duration: Number, temps considéré en millisecondes
  // @return: un déplacement {x,y}
  delta(duration) {
    return { x: (this.#x * duration) / 1000, y: (this.#y * duration) / 1000 };
  }
}
class Rectangle {
  #position;
  #size;
  constructor(position, size) {
    this.#position = position;
    this.#size = size;
  }

  areIntersecting(r) {
    if (
      ((this.#position.x >= r.#position.x &&
        this.#position.x <= r.#position.x + r.#size.width) ||
        (this.#position.x + this.#size.width >= r.#position.x &&
          this.#position.x + this.#size.width <=
            r.#position.x + r.#size.width)) && // controle lateral
      ((this.#position.y >= r.#position.y &&
        this.#position.y <= r.#position.y + r.#size.height) ||
        (this.#position.y + this.#size.height >= r.#position.y &&
          this.#position.y + this.#size.height <=
            r.#position.y + r.#size.height)) // controle vertical
    ) {
      return true;
    }
    return false;
  }

  isInside(r) {
    if (
      this.#position.x >= r.#position.x &&
      this.#position.x <= r.#position.x + r.#size.width &&
      this.#position.x + this.#size.width >= r.#position.x &&
      this.#position.x + this.#size.width <= r.#position.x + r.#size.width && // controle lateral
      this.#position.y >= r.#position.y &&
      this.#position.y <= r.#position.y + r.#size.height &&
      this.#position.y + this.#size.height >= r.#position.y &&
      this.#position.y + this.#size.height <= r.#position.y + r.#size.height // controle vertical
    ) {
      return true;
    }
    return false;
  }
}

// Fonction qui indique si on est en dehors des limites
const outOfLimit = (min, val, max) =>
  val <= min ? true : val >= max ? true : false;

// Fonction qui retourne une valeur entre deux bornes
const limit = (min, val, max) => (val < min ? min : val > max ? max : val);

///////////////////////////////////////////////////////////////
// Objet qui représente l'aire du jeu
///////////////////////////////////////////////////////////////

const playground = {
  // Objet DOM de l'aire de jeu
  DOM: window.document.getElementById("playground"),
};

// Initialiste la dimension de l'aire de jeu
playground.size = playground.DOM.getBoundingClientRect();

///////////////////////////////////////////////////////////////
// Notion de sprite
///////////////////////////////////////////////////////////////

class Sprite {
  id; // l'Id du sprite, pour info
  #DOM; // Objet DOM qui représente le sprite
  #pos; // Position actuelle du sprite
  #speed; // La vitesse de déplacement actuelle en pixels par seconde
  #size; // Taille de l'objet { height, width }
  arret = false;
  timeBeforeRepop = 0;
  constructor(id) {
    this.id = id;
    // Recherche l'élément DOM
    const DOM = document.getElementById(id);
    // Vérifie qu'il existe
    if (DOM == null) {
      throw new Error("HTML object " + id + " not found");
    }
    // Crée un objet DOM pour l'afficher
    this.#DOM = DOM.cloneNode();
    // Supprime l'attribut id
    this.#DOM.setAttribute("id", "");
    // Place l'objet dans la DOM
    playground.DOM.appendChild(this.#DOM);
    // Initialise sa position relative

    // Vitesse en pixels par secondes : objet initialement immobile
    if (this.id == "R2D2") this.#speed = new Speed(502);
    else this.#speed = new Speed(100);

    // Calcule sa taille
    this.#size = this.#DOM.getBoundingClientRect();
  
    this.#pos = new Position(0, 0);
   
  }

  // Place le sprite à une position p donnée
  set pos(p) {
    // Empeche de sortir de l'aire de jeux
    let minX = 0;
    let minY = 0;
    let maxX;
    let maxY;
    maxX = playground.size.width - this.#size.width;
    if (this.id == "R2D2" || this.id == "darthvader") {
      maxY = playground.size.height - this.#size.height;
    } else {
      maxY = playground.size.height;
    }
    let pos = new Position(limit(minX, p.x, maxX), limit(minY, p.y, maxY));
    this.#DOM.style.left = pos.x + "px";
    this.#DOM.style.top = pos.y + "px";
    this.#pos = pos;
    if (this.id == "R2D2") {
      //cette partie sert à mettre la vitesse à 0 sur l'axe qui correspond lorque l'on cogne un mur (plus maniable !)
      if (
        this.#pos.x == playground.size.width - this.#size.width ||
        this.#pos.x == 0
      )
        this.#speed.x = 0;
      if (
        this.#pos.y == playground.size.height - this.#size.height ||
        this.pos.y == 0
      )
        this.#speed.y = 0;
    }
  }
  get dom() {
    return this.#DOM;
  }
  get pos() {
    return this.#pos;
  }

  get size() {
    return this.#size;
  }

  stop() {
    this.#speed.stop();
  }

  isStopped() {
    return this.#speed.isStopped();
  }

  get speed() {
    return this.#speed;
  }

  hitbox(pos = this.pos) {
    // console.log(this.#size);
    return new Rectangle(pos, this.size);
  }

  // Change la vitesse du sprite par des incréments
  changeSpeed(dx, dy) {
    this.#speed.change(dx, dy);
  }

  // Change sa position pour la nouvelle frame en fonction de sa vitesse
  update(duration) {
    // Deplace la position en fonction de la vitesse et du temps
    this.pos = this.#pos.move(this.#speed, duration);
  }
  planeIsTouched() {
    // à utiliser pour les plane
    if (!this.arret) {
      this.#DOM.remove();
      this.arret = true;
      this.timeBeforeRepop = 450;
      game.points += 100;
      if ( game.darthvader.start == true && game.run
      ){
        game.darthvader.start = false;
      }
      game.spritesTouched.push(this);
    }
  }
  restart() {
    const DOM = document.getElementById(this.id);
    this.#DOM = DOM.cloneNode();
    // Supprime l'attribut id
    this.#DOM.setAttribute(this.id, "");
    // Place l'objet dans la DOM
    playground.DOM.appendChild(this.#DOM);
    // Initialise sa position relative
    // Vitesse en pixels par secondes : objet initialement immobile
    // Calcule sa taille
    this.#size = this.#DOM.getBoundingClientRect();
  }
  checkPos() {
    if (this.id == "R2D2") {
      this.#pos = new Position(0, 0);
    } else {
      this.#pos = new Position(playground.size.width - this.size.width, 0);
    }
    this.pos = this.#pos;
  }
}
class Plane extends Sprite {
  // Temps avant un démmarage
  waitingTime;
  constructor(id) {
    super(id);
    this.waitingTime = 0;
  }

  // Démarre l'avion du haut de l'écran
  start() {
    // Choisit une position x random
    let x = playground.size.width * Math.random();
    this.pos = new Position(x, -this.size.height);
    this.changeSpeed(3, 203);
    // console.log(this.id, 'start')
  }

  // Vrai si le sprite a atteint de bas de l'aire de jeux
  isAtBottom() {
    return this.pos.y >= playground.size.height;
  }

  // Vrai si le sprite a atteint de bas de l'aire de jeux
  isAtBottom() {
    return this.pos.y >= playground.size.height;
  }
  restart() {
    super.restart();
    this.arret = false;
    this.start();
  }

  update(duration) {
    super.update(duration);
    // Regarde si le sprite a disparu au bas de l'écran
    if (this.isAtBottom() && !this.isStopped()) {
      // Arrete le sprite
      this.stop();
      // Place un temps d'attende avant de redémmarer
      this.waitingTime = 60;
    }
    // Si le sprite est arrété, attend puis redémmare
    if (this.isStopped()) {
      this.waitingTime -= duration;
      if (this.waitingTime <= 0) {
        this.waitingTime = 0;
        this.start();
      }
    }
    let r2Hitbox = game.r2d2.hitbox();
    if (r2Hitbox.areIntersecting(this.hitbox())) {
      super.planeIsTouched();
    }
  }
}
class Darthv extends Sprite {
  // Temps avant un démmarage
  waitingTime;
  timeBeforeLosingPointsAgain = 0;
  waiting = false;
  start = true;
  constructor(id) {
    super(id);
    this.waitingTime = 0;
  }

  update(duration) {
    if (!this.start) {
      this.changeSpeed(this.calculateX(), this.calculateY());
      // il se déplace en direction du R2D2
      this.pos = this.pos.move(this.speed, duration);
      let r2Hitbox = game.r2d2.hitbox();
      if (r2Hitbox.areIntersecting(this.hitbox())) {
        this.losingPoints();
      }
      if (this.waiting) {
        this.timeBeforeLosingPointsAgain = this.timeBeforeLosingPointsAgain - 1;
        if (this.timeBeforeLosingPointsAgain == 0) this.waiting = false;
      }
    }
  }
  calculateX() {
    let vaderX = this.pos.x;
    let r2X = game.r2d2.pos.x;
    return r2X - vaderX;
  }
  calculateY() {
    let vaderY = this.pos.y;
    let r2Y = game.r2d2.pos.y;
    return r2Y - vaderY;
  }
  losingPoints() {
    if (game.points >= 49) {
      if (this.timeBeforeLosingPointsAgain == 0) {
        game.points -= game.points >= 199 ? 200 : 50;
        this.waiting = true;
        this.timeBeforeLosingPointsAgain = 200;
      }
    }
  }
  checkPos() {
    super.checkPos();
    this.speed.stop();
  }
}
let game = {
  interval: null,
  run: false,
  tFrameLast: 0,
  points: 0,
  spritesTouched: [],
  sprites: [],
};

// Mise à jour du jeux à la date indiquée
game.update = function (tFrame) {
  if (game.run) {
    if (time.hasEnded()) {
      game.stop();
    } else {
      if ( game.points == 0 
      )
        game.darthvader.start = true;
      // Calcule la durée qui s'est passé apres la frame précédente
      let duration = tFrame - this.tFrameLast;
      // Met à jour le temps précédent
      this.tFrameLast = tFrame;
      // Déplace le robot
      game.r2d2.update(duration);
      game.darthvader.update(duration);
      // Déplace les autres objets
      for (let sprite of this.sprites) {
        sprite.update(duration);
      }
      let i = 0;
      for (let sprite of this.spritesTouched) {
        if (sprite.timeBeforeRepop == 0) {
          sprite.restart();
          this.spritesTouched.splice(i, 1);
        } else {
          sprite.timeBeforeRepop -= 1;
        }
        i += 1;
      }
      point.innerText = " " + game.points;
    }
  }
};

// Reaction du jeux à l'enfoncement d'une touche
game.onkeydown = function (key) {
  const delta = 10;
  switch (key) {
    case "ArrowLeft":
      game.r2d2.changeSpeed(-delta, 0);
      break;
    case "ArrowUp":
      game.r2d2.changeSpeed(0, -delta);
      break;
    case "ArrowRight":
      game.r2d2.changeSpeed(delta, 0);
      break;
    case "ArrowDown":
      game.r2d2.changeSpeed(0, delta);
      break;
    case "s":
      game.run = false;
      break;
    default:
    // console.log(key)
  }
};

// Installe la lecture des caractères
window.onkeydown = function (e) {
  try {
    game.onkeydown(e.key);
  } catch (e) {
    ("impossible de manipuler le r2 hors du jeu");
  }
};

// tFrame est le temps d'appel de l'animation passé à main en ms
function main(tFrame) {
  game.stopMain = window.requestAnimationFrame(main);
  if (!game.run) {
    window.cancelAnimationFrame(game.stopMain);
    console.log("Game over");
  } else {
    game.update(tFrame);
  }
}

// Démmare le jeu
game.start = function () {
  // lance tous les sprites
  for (let sprite of this.sprites) {
    sprite.start();
  }
};

game.reinit = function () {
  //fonction si on relance une partie
  for ( let sprite of this.sprites){
    sprite.dom.style.visibility = "visible";
  }
  game.r2d2.checkPos();
  game.darthvader.checkPos();
  game.darthvader.dom.style.visibility = "visible";
  game.r2d2.dom.style.visibility = "visible";
  this.tFrameLast = 0;
  time.time = 120;
  time.dom.innerText = time.format();
  game.interval = setInterval(timer, 1000);
  this.darthvader.start = true;
  this.run = true;
  game.start();

  main(0);
};
game.stop = function () {
  game.run = false;
  game.darthvader.dom.style.visibility = "hidden";
  game.r2d2.dom.style.visibility = "hidden";
  for ( let sprite of this.sprites){
    sprite.dom.style.visibility = "hidden";
  }
  panelStart.style.visibility = "visible";
  buttonStart.innerText = "(re)commencer";
  panelStart.appendChild(scoreFinal);
  scoreFinal.innerText = "Score final : " + game.points;
  game.points = 0;
  clearInterval(game.interval);
};
game.init = function () {
  if (game.r2d2 != undefined) {
    game.reinit();
  } else {
    
    game.r2d2 = new Sprite("R2D2");
    game.darthvader = new Darthv("darthvader");
    game.r2d2.checkPos();
    game.darthvader.checkPos();
    // Attend l'initialisation des autres sprites
    let sprite = new Plane("x_wing");
    game.sprites.push(sprite);

    sprite = new Plane("anakin_starfighter");
    game.sprites.push(sprite);

    sprite = new Plane("naboo_starfighter");
    game.sprites.push(sprite);

    sprite = new Plane("obi_wan_starfighter");
    game.sprites.push(sprite);

    this.run = true;
    this.tFrameLast = 0;
    time.time = 120;
    time.dom.innerText = time.format();
    game.interval = setInterval(timer, 1000);
    game.start();
    main(0); // Début du cycle
  }
};

const time = {
  dom: document.getElementById("time"),
  time: 120,
  format: function () {
    let min = Math.floor(this.time / 60).toString();
    let sec = (this.time % 60).toString();
    sec = sec.length == 1 ? "0" + sec : sec;
    return min + " : " + sec;
  },
  hasEnded: function () {
    return this.time == 0;
  },
};

function timer() {
  if (!time.hasEnded()) {
    time.time--;
    time.dom.innerText = time.format();
  }
}
const buttonStart = document.getElementById("startButton");
const panelStart = document.getElementById("start");
buttonStart.addEventListener("click", function () {
  panelStart.style.visibility = "hidden";
  game.init();
});

const scoreFinal = document.createElement("div");
scoreFinal.id = "scorefinal";


