//  ui-effects.js

// Highlight mode buttons on click
const duoBtnEl = document.getElementById('duoButton');
const survivalBtnEl = document.getElementById('survivalButton');

duoBtnEl.addEventListener('click', () => {
  duoBtnEl.classList.add('selected');
  survivalBtnEl.classList.remove('selected');
});

survivalBtnEl.addEventListener('click', () => {
  survivalBtnEl.classList.add('selected');
  duoBtnEl.classList.remove('selected');
});

// Play Again button listener: hide Game Over overlay, show Start Screen
const playAgainBtns = document.querySelectorAll('button[onclick="playAgain()"]');
playAgainBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
  });
});
