/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

class App {
  constructor() {
    this.currentPage = 'game';
    this.gamePage = document.querySelector('#game');
    this.infoPage = document.querySelector('#info');
    this.createPage = document.querySelector('#create');
    this.setPage('game');

    this.createPageButton = document.querySelector('#create-page-button');
    this.infoButton = document.querySelector('#info-button');
    this.createPageButton.addEventListener('click', () => this.setPage(this.currentPage === 'create' ? 'game' : 'create'));
    this.infoButton.addEventListener('click', () => this.setPage(this.currentPage === 'info' ? 'game' : 'info'));

    this.container = document.querySelector('#game main');
    this.cells = [];
    this.selectedCells = [];
    this.cellsState = [];

    // create cells
    for (let i = 0; i < 64; i++) {
      const cell = document.createElement('canvas');
      cell.classList.add('cell');
      this.container.appendChild(cell);
      this.cells.push(cell);

      cell.width = 64;
      cell.height = 64;
      cell.dataset.index = `${i}`;
      cell.addEventListener('click', e => {
        const cell = e.target;

        if (this.selectedCells.indexOf(cell) === -1) {
          cell.classList.add('selected');
          this.selectedCells.push(cell);
        } else {
          cell.classList.remove('selected');
          this.selectedCells.splice(this.selectedCells.indexOf(cell), 1);
        }

        if (this.selectedCells.length === 2) {
          postWebViewMessage({
            type: 'swap',
            data: [
              +this.selectedCells[0].dataset.index,
              +this.selectedCells[1].dataset.index,
            ]
          });

          // update locally
          [
            this.cellsState[this.selectedCells[0].dataset.index],
            this.cellsState[this.selectedCells[1].dataset.index],
          ] = [
            this.cellsState[this.selectedCells[1].dataset.index],
            this.cellsState[this.selectedCells[0].dataset.index],
          ];
          this.updateCells();

          for (const cell of this.selectedCells)
            cell.classList.remove('selected');

          this.selectedCells = [];
        }
      })
    }

    this.createCanvas = document.querySelector('#create-canvas');
    this.createCtx = this.createCanvas.getContext('2d');
    this.colorButtons = document.querySelectorAll('.color');
    this.sizeButtons = document.querySelectorAll('.size');
    for (const button of this.colorButtons) {
      button.style.background = button.dataset.color;
      button.addEventListener('click', () => this.setPointerColor(button.dataset.color));
    }
    for (const button of this.sizeButtons)
      button.addEventListener('click', () => this.setPointerSize(button.dataset.size));

    this.isDrawing = false;
    this.pointerColor = '#000000';
    this.pointerSize = 15;
    this.pointerX = 0;
    this.pointerY = 0;
    this.canvasRatio = 512 / Math.min(window.innerWidth * 0.55, window.innerHeight * 0.55);
    this.createCanvas.addEventListener('mousedown', e => {
      this.pointerX = e.offsetX;
      this.pointerY = e.offsetY;
      this.isDrawing = true;
      this.handleDraw(e);
    });
    this.createCanvas.addEventListener('touchstart', e => {
      this.pointerX = e.offsetX;
      this.pointerY = e.offsetY;
      this.isDrawing = true;
      this.handleDraw(e);
    });
    this.createCanvas.addEventListener('mouseup', () => this.isDrawing = false);
    this.createCanvas.addEventListener('touchend', () => this.isDrawing = false);
    this.createCanvas.addEventListener('mousemove', e => this.handleDraw(e));
    this.createCanvas.addEventListener('touchmove', e => this.handleDraw(e));

    this.createInput = document.querySelector('#create-input');
    this.createButton = document.querySelector('#create-button');
    this.createButton.addEventListener('click', () => {
      const answer = this.createInput.value.toLowerCase().trim();
      if (answer === '') return;

      postWebViewMessage({
        type: 'create',
        data: {
          image: this.createCanvas.toDataURL(),
          answer,
        }
      })
    })

    this.answer = '';
    this.answerP = document.querySelector('#answer');
    this.input = document.querySelector('input');
    this.input.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.handleSubmit(e.target.value);
    })

    addEventListener('load', () => postWebViewMessage({ type: 'ready' }))
    addEventListener('message', this.#onMessage);
  }

  setPage(page) {
    this.currentPage = page;

    if (page === 'game') {
      this.gamePage.classList.remove('hidden');
      this.infoPage.classList.add('hidden');
      this.createPage.classList.add('hidden');
    }

    if (page === 'info') {
      this.infoPage.classList.remove('hidden');
      this.gamePage.classList.add('hidden');
      this.createPage.classList.add('hidden');
    }

    if (page === 'create') {
      this.createPage.classList.remove('hidden');
      this.infoPage.classList.add('hidden');
      this.gamePage.classList.add('hidden');
    }
  }

  updateCells(state = undefined) {
    if (state) this.cellsState = state;

    for (let i = 0; i < this.cellsState.length; i++) {
      const cell = this.cells[i];
      const ctx = cell.getContext('2d');
      const x = this.cellsState[i] % 8, y = Math.floor(this.cellsState[i] / 8);

      ctx.clearRect(0, 0, cell.width, cell.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, cell.width, cell.height);
      if (this.image)
        ctx.drawImage(this.image, x * 64, y * 64, 64, 64, 0, 0, 64, 64);
    }
  }

  setPointerColor(color) {
    this.pointerColor = color;
    for (const button of this.colorButtons) {
      if (button.dataset.color === color)
        button.classList.add('selected');
      else
        button.classList.remove('selected');
    }
  }

  setPointerSize(size) {
    this.pointerSize = size;
    for (const button of this.sizeButtons) {
      if (button.dataset.size === size)
        button.classList.add('selected');
      else
        button.classList.remove('selected');
    }
  }

  handleDraw(event) {
    if (!this.isDrawing) return;

    this.createCtx.lineWidth = this.pointerSize;
    this.createCtx.lineCap = 'round';
    this.createCtx.strokeStyle = this.pointerColor;

    this.createCtx.beginPath();
    this.createCtx.moveTo(this.pointerX * this.canvasRatio, this.pointerY * this.canvasRatio);
    this.pointerX = event.offsetX;
    this.pointerY = event.offsetY;
    this.createCtx.lineTo(this.pointerX * this.canvasRatio, this.pointerY * this.canvasRatio);
    this.createCtx.stroke();
  }

  handleSubmit(value) {
    if (value.toLowerCase().trim() === this.answer) {
      this.input.classList.add('hidden');
      this.answerP.classList.remove('hidden');
      this.answerP.textContent = this.answer;
      postWebViewMessage({ type: 'correct' });
    } else {
      this.input.value = '';
      postWebViewMessage({ type: 'wrong' });
    }
  }

  /**
   * @arg {MessageEvent<DevvitSystemMessage>} ev
   * @return {void}
   */
  #onMessage = (ev) => {
    // Reserved type for messages sent via `context.ui.webView.postMessage`
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;

    switch (message.type) {
      case 'update': {
        if (message.data.answer)
          this.answer = message.data.answer;

        if (message.data.image) {
          this.image = new Image();
          this.image.src = message.data.image;
          this.image.onload = () => this.updateCells(message.data.state);
        } else
          this.updateCells(message.data.state);

        break;
      }
      default:
        const _ = message;
        break;
    }
  };
}

/**
 * Sends a message to the Devvit app.
 * @arg {WebViewMessage} msg
 * @return {void}
 */
function postWebViewMessage(msg) {
  parent.postMessage(msg, '*');
}

new App();
