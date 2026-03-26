// Final Project - Hangman Game
// Matheus Isaac - COMP2132

const dataUrl = "data/words.json";

const game = {
  words: [],
  currentWord: "",
  currentHint: "",
  guessedLetters: [],
  wrongGuesses: 0,
  maxGuesses: 6,
  isOver: false,

  elements: {},

  // Initialize the game
  init: function () {
    this.cacheDom();
    this.loadWords();
    this.buildKeyboard();
    this.bindEvents();
  },

  // Cache DOM elements for reuse
  cacheDom: function () {
    this.elements.hangmanImg = document.getElementById("hangmanImg");
    this.elements.hintText = document.getElementById("hintText");
    this.elements.wordDisplay = document.getElementById("wordDisplay");
    this.elements.wrongCount = document.getElementById("wrongCount");
    this.elements.maxGuesses = document.getElementById("maxGuesses");
    this.elements.keyboard = document.getElementById("keyboard");
    this.elements.message = document.getElementById("message");

    this.elements.maxGuesses.textContent = this.maxGuesses;
  },

  // Load words and hints from JSON file
  loadWords: function () {
    const self = this;

    fetch(dataUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load words.json");
        }
        return response.json();
      })
      .then(function (data) {
        self.words = data;
        self.startNewGame();
      })
      .catch(function (error) {
        console.error(error);
        self.showMessage("Could not load word list. Please check the project files.", "error");
      });
  },

  // Build the virtual QWERTY keyboard
  buildKeyboard: function () {
    const rows = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Z", "X", "C", "V", "B", "N", "M"]
    ];

    this.elements.keyboard.innerHTML = "";

    for (let i = 0; i < rows.length; i++) {
      const rowEl = document.createElement("div");
      rowEl.className = "kb-row";

      for (let j = 0; j < rows[i].length; j++) {
        const letter = rows[i][j];
        const btn = document.createElement("button");
        btn.textContent = letter;
        btn.className = "kb-key";
        btn.value = letter.toLowerCase();
        btn.addEventListener("click", this.onKeyClick.bind(this));
        rowEl.appendChild(btn);
      }

      this.elements.keyboard.appendChild(rowEl);
    }
  },

  // Handle clicks on virtual keyboard
  onKeyClick: function (event) {
    if (this.isOver) {
      return;
    }
    const letter = event.target.value;
    this.handleGuess(letter);
  },

  // Bind physical keyboard events
  bindEvents: function () {
    const self = this;

    document.addEventListener("keydown", function (e) {
      if (self.isOver) {
        return;
      }

      const key = e.key.toLowerCase();

      // Simple check for letters a-z
      if (key >= "a" && key <= "z") {
        self.handleGuess(key);
      }
    });
  },

  // Start a new game
  startNewGame: function () {
    if (!this.words || this.words.length === 0) {
      this.showMessage("No words available. Check words.json.", "error");
      return;
    }

    const randomIndex = Math.floor(Math.random() * this.words.length);
    const selected = this.words[randomIndex];

    this.currentWord = selected.word.toLowerCase();
    this.currentHint = selected.hint;
    this.guessedLetters = [];
    this.wrongGuesses = 0;
    this.isOver = false;

    // Reset UI
    this.elements.hintText.textContent = this.currentHint;
    this.elements.wrongCount.textContent = this.wrongGuesses;
    this.elements.message.textContent = "";
    this.elements.message.className = "message";

    const keys = document.querySelectorAll(".kb-key");
    for (let i = 0; i < keys.length; i++) {
      keys[i].disabled = false;
      keys[i].classList.remove("correct", "wrong", "shake");
    }

    this.updateWordDisplay();
    this.updateHangmanImage();
  },

  // Update the displayed word with guessed letters
  updateWordDisplay: function () {
    let display = "";

    for (let i = 0; i < this.currentWord.length; i++) {
      const ch = this.currentWord[i];
      if (this.guessedLetters.indexOf(ch) !== -1) {
        display += ch.toUpperCase() + " ";
      } else {
        display += "_ ";
      }
    }

    this.elements.wordDisplay.textContent = display.trim();
  },

  // Update hangman image based on wrong guesses
  updateHangmanImage: function () {
    const imgIndex = Math.min(this.wrongGuesses, this.maxGuesses);
    this.elements.hangmanImg.src = "../images/hangman-" + imgIndex + ".svg";
  },

  // Show result modal (win or lose)
  showModal: function (type) {
    const modal = document.getElementById("resultModal");
    const gif = document.getElementById("modalGif");
    const titleEl = document.getElementById("modalTitle");
    const msgEl = document.getElementById("modalMsg");
    const playBtn = document.getElementById("modalPlayAgain");

    if (type === "win") {
      gif.src = "../images/victory.gif";
      titleEl.textContent = "You Won!";
      titleEl.className = "modal-title win";
      msgEl.textContent = 'The word was "' + this.currentWord.toUpperCase() + '".';
    } else {
      gif.src = "../images/lost.gif";
      titleEl.textContent = "You Lost!";
      titleEl.className = "modal-title lose";
      msgEl.textContent = 'The word was "' + this.currentWord.toUpperCase() + '".';
    }

    modal.classList.add("active");

    const self = this;
    playBtn.onclick = function () {
      modal.classList.remove("active");
      self.startNewGame();
    };
  },

  // Handle a guessed letter
  handleGuess: function (letter) {
    // Already guessed
    if (this.guessedLetters.indexOf(letter) !== -1) {
      const keys = document.querySelectorAll(".kb-key");
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].value === letter) {
          keys[i].classList.add("shake");
          (function (btn) {
            setTimeout(function () {
              btn.classList.remove("shake");
            }, 400);
          })(keys[i]);
        }
      }
      return;
    }

    this.guessedLetters.push(letter);

    // Update keyboard button
    const keys = document.querySelectorAll(".kb-key");
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].value === letter) {
        keys[i].disabled = true;
        if (this.currentWord.indexOf(letter) !== -1) {
          keys[i].classList.add("correct");
        } else {
          keys[i].classList.add("wrong");
        }
      }
    }

    if (this.currentWord.indexOf(letter) !== -1) {
      this.showMessage('Good guess! "' + letter.toUpperCase() + '" is in the word.', "success");
      this.updateWordDisplay();
      this.checkWin();
    } else {
      this.wrongGuesses++;
      this.elements.wrongCount.textContent = this.wrongGuesses;
      this.showMessage('Oops! "' + letter.toUpperCase() + '" is not in the word.', "error");
      this.updateHangmanImage();
      this.checkLose();
    }
  },

  // Check if player has won
  checkWin: function () {
    let allRevealed = true;

    for (let i = 0; i < this.currentWord.length; i++) {
      const ch = this.currentWord[i];
      if (this.guessedLetters.indexOf(ch) === -1) {
        allRevealed = false;
      }
    }

    if (allRevealed) {
      this.isOver = true;
      this.endGame();
      const self = this;
      setTimeout(function () {
        self.showModal("win");
      }, 400);
    }
  },

  // Check if player has lost
  checkLose: function () {
    if (this.wrongGuesses >= this.maxGuesses) {
      this.isOver = true;
      this.endGame();
      const self = this;
      setTimeout(function () {
        self.showModal("lose");
      }, 400);
    }
  },

  // Disable all keys when game ends
  endGame: function () {
    const keys = document.querySelectorAll(".kb-key");
    for (let i = 0; i < keys.length; i++) {
      keys[i].disabled = true;
    }
  },

  // Show feedback message
  showMessage: function (text, type) {
    this.elements.message.textContent = text;
    this.elements.message.className = "message";
    if (type === "error") {
      this.elements.message.classList.add("error");
    }
    if (type === "success") {
      this.elements.message.classList.add("success");
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  game.init();
});