// Global game state variables
let deck = [];
let currentCard = null;
let roundsCompleted = 0; // counts only rounds that are not draws
let playerScore = 0;
let dealerScore = 0;
let history = [];

// Suit and rank info arrays
const suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
const ranks = [
  "Ace",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Jack",
  "Queen",
  "King",
];

// Returns an object describing the card for a given number 1..52
function getCardInfo(cardNum) {
  // Convert cardNum to index 0-51
  const index = cardNum - 1;
  const suitIndex = Math.floor(index / 13);
  const rankIndex = index % 13;
  const suit = suits[suitIndex];
  const rank = ranks[rankIndex];

  // Determine colour (Clubs and Spades are black; Diamonds and Hearts are red)
  const color = (suit === "Clubs" || suit === "Spades") ? "black" : "red";

  // Determine card “value” for comparison:
  // For Aces: red Ace is low (value 1), black Ace is high (value 14)
  // For non-Aces: value = (rankIndex + 1) (2 -> 2, ... King -> 13)
  let value = 0;
  if (rank === "Ace") {
    value = (color === "black") ? 14 : 1;
  } else {
    value = rankIndex + 1;
  }
  
  // Set image source based on the card number from the images folder.
  const image = `images/${cardNum}.png`;

  return { suit, rank, color, value, name: rank + " of " + suit, image };
}

// Build and shuffle a deck of numbers 1..52
function initializeDeck() {
  deck = [];
  for (let i = 1; i <= 52; i++) {
    deck.push(i);
  }
  // Shuffle deck (Fisher-Yates shuffle)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// Update scoreboard display
function updateScoreboard() {
  document.getElementById("player-score").textContent = playerScore;
  document.getElementById("dealer-score").textContent = dealerScore;
  document.getElementById("round-count").textContent = roundsCompleted;
}

// Display the current card using its image
function displayCurrentCard() {
  const info = getCardInfo(currentCard);
  const cardImg = document.getElementById("card-img");
  cardImg.src = info.image;
  cardImg.alt = info.name;
}

// Compare two cards
// Returns: 1 if newCard is considered higher than baseCard,
//         -1 if newCard is lower than baseCard,
//          0 if it is a draw (same rank and same colour)
function compareCards(baseCard, newCard) {
  const baseInfo = getCardInfo(baseCard);
  const newInfo = getCardInfo(newCard);

  if (baseInfo.value === newInfo.value) {
    // Same rank; check colours:
    if (baseInfo.color === newInfo.color) {
      // Draw if same colour
      return 0;
    } else {
      // If colours differ, black wins
      return (newInfo.color === "black") ? 1 : -1;
    }
  } else {
    // Normal numeric comparison
    return (newInfo.value > baseInfo.value) ? 1 : -1;
  }
}

// Append a round’s result to the history list.
// Displays both card images as thumbnails and highlights the winner.
function updateHistory(roundResult, roundNumber) {
  const historyList = document.getElementById("history-list");
  const li = document.createElement("li");
  li.classList.add("round-item");

  const baseInfo = getCardInfo(roundResult.baseCard);
  const newInfo = getCardInfo(roundResult.newCard);
  
  let resultHTML = `<strong>Round ${roundNumber}:</strong> `;
  resultHTML += `<img src="${baseInfo.image}" alt="${baseInfo.name}" class="history-card"> `;
  resultHTML += `<span class="arrow-container">`;
  resultHTML += `<span class="long-arrow">----------&gt;</span><br>`;
  resultHTML += `<span class="player-choice">${roundResult.guess.charAt(0).toUpperCase() + roundResult.guess.slice(1)}</span>`;
  resultHTML += `</span> `;
  resultHTML += `<img src="${newInfo.image}" alt="${newInfo.name}" class="history-card"> `;
  
  if (roundResult.outcome === "draw") {
    resultHTML += `<span class="outcome-text draw-outcome">(Draw – round not counted)</span>`;
  } else {
    if (roundResult.winningSide === "player") {
      resultHTML += `<span class="outcome-text"><span class="winning">Player wins</span></span>`;
    } else {
      resultHTML += `<span class="outcome-text"><span class="losing">Dealer wins</span></span>`;
    }
  }

  li.innerHTML = resultHTML;
  historyList.appendChild(li);
}




// Handle player's guess ("higher" or "lower")
function handleGuess(guess) {
  // Draw the next card from deck
  if (deck.length === 0) {
    document.getElementById("message").textContent = "No more cards in deck!";
    return;
  }
  const nextCard = deck.pop();
  const comp = compareCards(currentCard, nextCard);

  // If comp is 0, it is a draw (cards are same rank & colour) and round is not counted.
  if (comp === 0) {
    document.getElementById("message").textContent =
      "It was a draw (same rank and colour). This round will not be counted.";
    // Record round history as a draw (round number not increased)
    history.push({
      baseCard: currentCard,
      newCard: nextCard,
      outcome: "draw",
      winningSide: null,
      guess: guess,
    });
    updateHistory(history[history.length - 1], roundsCompleted + 1);
    // The drawn card becomes the new current card and re-prompt the guess.
    currentCard = nextCard;
    displayCurrentCard();
    return;
  }

  // Determine if player’s guess is correct:
  // If guess is "higher", then comp should be 1. If "lower", comp should be -1.
  let playerWon = false;
  if ((guess === "higher" && comp === 1) || (guess === "lower" && comp === -1)) {
    playerWon = true;
    playerScore++;
    document.getElementById("message").textContent = "You guessed correctly!";
  } else {
    dealerScore++;
    document.getElementById("message").textContent = "Sorry, wrong guess.";
  }

  roundsCompleted++;
  updateScoreboard();

  // Record round history
  history.push({
    baseCard: currentCard,
    newCard: nextCard,
    outcome: playerWon ? "win" : "loss",
    winningSide: playerWon ? "player" : "dealer",
    guess: guess,
  });
  updateHistory(history[history.length - 1], roundsCompleted);

  // For next round, new card becomes the current card
  currentCard = nextCard;
  displayCurrentCard();

  // Check if game is over (5 completed rounds)
  if (roundsCompleted >= 5) {
    endGame();
  }
}

function endGame() {
  document.getElementById("guess-section").style.display = "none";
  let finalMessage = "";
  if (playerScore > dealerScore) {
    finalMessage = "Game Over. You win!";
  } else if (dealerScore > playerScore) {
    finalMessage = "Game Over. Dealer wins!";
  } else {
    finalMessage = "Game Over. It’s a tie!";
  }
  document.getElementById("message").textContent = finalMessage;
  document.getElementById("start-btn").style.display = "block";
}

// Start a new game: reset all game state
function startGame() {
  initializeDeck();
  currentCard = deck.pop();
  roundsCompleted = 0;
  playerScore = 0;
  dealerScore = 0;
  history = [];
  document.getElementById("history-list").innerHTML = "";
  updateScoreboard();
  displayCurrentCard();
  document.getElementById("message").textContent = "";
  document.getElementById("guess-section").style.display = "block";
  document.getElementById("start-btn").style.display = "none";
}

// Quit game mid-way: simply reset state and show message
function quitGame() {
  document.getElementById("message").textContent = "You quit the game.";
  document.getElementById("guess-section").style.display = "none";
  document.getElementById("start-btn").style.display = "block";
  // Reset current card image to show the back
  const cardImg = document.getElementById("card-img");
  cardImg.src = "images/back.png";
  cardImg.alt = "Card Back";
}


// Set up event listeners after the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("higher-btn").addEventListener("click", function () {
    handleGuess("higher");
  });
  document.getElementById("lower-btn").addEventListener("click", function () {
    handleGuess("lower");
  });
  document.getElementById("quit-btn").addEventListener("click", quitGame);
});
