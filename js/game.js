document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameScreen = document.getElementById('game-screen');
    const startBtn = document.getElementById('start-btn');
    const dealerCardsEl = document.getElementById('dealer-cards');
    const playerCardsEl = document.getElementById('player-cards');
    const dealerPointsEl = document.getElementById('dealer-points');
    const playerPointsEl = document.getElementById('player-points');
    const chipsEl = document.getElementById('chips');
    const betEl = document.getElementById('bet');
    const winsEl = document.getElementById('wins');
    const messageEl = document.getElementById('message');
    const betInfoEl = document.getElementById('bet-info');
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const playAgainBtn = document.getElementById('playagain-btn');
    const chipElements = document.querySelectorAll('.chip');
    
    // Estado del juego
    let deck = [];
    let dealerCards = [];
    let playerCards = [];
    let chips = 1000;
    let currentBet = 0;
    let wins = 0;
    let gameState = 'betting'; // betting, dealing, player-turn, dealer-turn, game-over
    
    // Inicializar el juego
    initGame();
    
    function initGame() {
        createDeck();
        updateUI();
        setupEventListeners();
    }
    
    function createDeck() {
        deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        
        // Barajar el mazo
        shuffleDeck();
    }
    
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    function dealCard(recipient) {
        if (deck.length === 0) {
            createDeck();
        }
        
        const card = deck.pop();
        if (recipient === 'player') {
            playerCards.push(card);
        } else {
            dealerCards.push(card);
        }
        
        return card;
    }
    
    function calculateHandValue(cards) {
        let value = 0;
        let aces = 0;
        
        for (let card of cards) {
            if (card.value === 'A') {
                aces++;
                value += 11;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }
        
        // Ajustar el valor de los Ases si es necesario
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        
        return value;
    }
    
    function startGame() {
        if (currentBet <= 0) {
            showMessage("¡Debe hacer una apuesta primero!");
            return;
        }
        
        gameState = 'dealing';
        dealerCards = [];
        playerCards = [];
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';
        
        // Deshabilitar botones de apuesta
        chipElements.forEach(chip => chip.style.pointerEvents = 'none');
        
        // Descontar la apuesta
        chips -= currentBet;
        updateUI();
        
        // Repartir cartas iniciales
        setTimeout(() => {
            dealCard('player');
            updatePlayerCards();
            
            setTimeout(() => {
                dealCard('dealer');
                updateDealerCards(false);
                
                setTimeout(() => {
                    dealCard('player');
                    updatePlayerCards();
                    
                    setTimeout(() => {
                        dealCard('dealer');
                        updateDealerCards(false);
                        
                        // Comprobar blackjack natural
                        const playerValue = calculateHandValue(playerCards);
                        const dealerValue = calculateHandValue(dealerCards);
                        
                        if (playerValue === 21) {
                            setTimeout(() => {
                                if (dealerValue === 21) {
                                    // Empate
                                    showMessage("¡Ambos tienen Blackjack! Empate.");
                                    chips += currentBet; // Devolver apuesta
                                    currentBet = 0;
                                    gameState = 'game-over';
                                    showPlayAgain();
                                    updateUI();
                                } else {
                                    // Blackjack del jugador
                                    showMessage("¡Blackjack! Ganas 3:2");
                                    const winnings = Math.floor(currentBet * 2.5);
                                    chips += winnings + currentBet;
                                    wins += winnings;
                                    currentBet = 0;
                                    gameState = 'game-over';
                                    showPlayAgain();
                                    updateUI();
                                }
                            }, 1000);
                        } else {
                            gameState = 'player-turn';
                            updateUI();
                            showMessage("¡Tu turno! ¿Pedir o plantarse?");
                        }
                    }, 500);
                }, 500);
            }, 500);
        }, 500);
    }
    
    function playerHit() {
        if (gameState !== 'player-turn') return;
        
        dealCard('player');
        updatePlayerCards();
        
        const playerValue = calculateHandValue(playerCards);
        if (playerValue > 21) {
            // Jugador se pasa
            gameState = 'game-over';
            showMessage("¡Te pasaste de 21! Pierdes.");
            currentBet = 0;
            showPlayAgain();
            updateUI();
        } else if (playerValue === 21) {
            // Jugador tiene 21, pasa turno al dealer
            playerStand();
        }
    }
    
    function playerStand() {
        if (gameState !== 'player-turn') return;
        
        gameState = 'dealer-turn';
        updateUI();
        showMessage("Turno del repartidor");
        
        // Revelar la carta oculta del dealer
        updateDealerCards(true);
        
        // Lógica del dealer
        setTimeout(dealerPlay, 1000);
    }
    
    function dealerPlay() {
        const dealerValue = calculateHandValue(dealerCards);
        
        if (dealerValue < 17) {
            // El dealer debe pedir
            dealCard('dealer');
            updateDealerCards(true);
            setTimeout(dealerPlay, 1000);
        } else {
            // El dealer se planta, determinar resultado
            determineWinner();
        }
    }
    
});