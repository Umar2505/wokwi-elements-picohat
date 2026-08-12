import { css, LitElement, svg, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ElementPin, GND, i2c, VCC } from './pin';

let picoHatCounter = 0;

/**
 * Pico HAT Element - A comprehensive development HAT for the Raspberry Pi Pico W.
 *
 * Layout follows the supplied pico-hat SVG artwork: portrait green PCB,
 * SSD1306 OLED module at the top, blue I2C sensor module beneath it,
 * red dome buttons on the left edge, red LED on the right edge and a
 * buzzer at the bottom. Pin headers run down both long edges.
 *
 * On-board components:
 *  - VEML6030  Ambient light sensor            (I2C0, addr 0x10)
 *  - HDC2021   Temperature & humidity sensor   (I2C0, addr 0x40)
 *  - PDM Microphone                            (GPIO: GP3 CLK / GP8 DAT)
 *  - ICM42670  6-axis accelerometer/gyroscope  (I2C0, addr 0x68)
 *  - Button 1  (GP2) and Button 2 (GP22)       (GPIO inputs)
 *  - RGB LED   (GP16 R / GP17 G / GP18 B)      (GPIO/PWM outputs)
 *  - Red LED   (GP14)                          (GPIO/PWM output)
 *  - Buzzer    (GP19)                          (GPIO/PWM output)
 *  - SSD1306   128x64 OLED display             (I2C1, addr 0x3C)
 *
 * A Raspberry Pi Pico W (RP2040) soldered onto the board controls everything.
 */
@customElement('wokwi-pico-hat')
export class PicoHatElement extends LitElement {
  // ------------------------------------------------------------------
  // Component properties
  // ------------------------------------------------------------------

  // Red LED (GP14)
  @property({ type: Boolean }) ledValue = false;
  @property() ledBrightness = 1;

  // RGB LED (GP16 R, GP17 G, GP18 B) - channel values 0..1
  @property() rgbRed = 0;
  @property() rgbGreen = 0;
  @property() rgbBlue = 0;

  // Buttons
  @property({ type: Boolean }) button1Pressed = false;
  @property({ type: Boolean }) button2Pressed = false;

  // Buzzer (GP19)
  @property({ type: Boolean }) buzzerSignal = false;

  // VEML6030 ambient light sensor
  @property() ambientLight = 0; // lux

  // HDC2021 temperature & humidity sensor
  @property() temperature = 25; // °C
  @property() humidity = 50; // %RH

  // ICM42670 accelerometer / gyroscope
  @property() accelX = 0;
  @property() accelY = 0;
  @property() accelZ = 1;
  @property() gyroX = 0;
  @property() gyroY = 0;
  @property() gyroZ = 0;

  // PDM microphone audio level 0..1
  @property() micLevel = 0;

  // SSD1306 OLED display
  @property({ type: Boolean }) oledEnabled = true;

  private readonly oledBuffer: Uint8Array = new Uint8Array((128 * 64) / 8);
  @state() private oledVersion = 0;


  private readonly uniqueId: string;

  // OLED I2C configuration
  private readonly oledAddress = 0x3c;
  private readonly oledContrast = 0xff;
  private readonly oledDisplayOn = true;
  private readonly oledInverted = false;

  // ------------------------------------------------------------------
  // Pin definitions - Raspberry Pi Pico W (40 pins)
  // Portrait board 64 x 176, 20 pins per long edge.
  // ------------------------------------------------------------------
  readonly pinInfo: ElementPin[] = [
    // Left side (top to bottom)
    { name: 'GP0', x: 5, y: 14, signals: [] },
    { name: 'GP1', x: 5, y: 22, signals: [] },
    { name: 'GND', x: 5, y: 30, signals: [GND()] },
    { name: 'GP2', x: 5, y: 38, signals: [], description: 'Button 1' },
    { name: 'GP3', x: 5, y: 46, signals: [], description: 'PDM Mic CLK' },
    { name: 'GP4', x: 5, y: 54, signals: [i2c('SDA', 1)], description: 'OLED SDA (I2C1)' },
    { name: 'GP5', x: 5, y: 62, signals: [i2c('SCL', 1)], description: 'OLED SCL (I2C1)' },
    { name: 'GND', x: 5, y: 70, signals: [GND()] },
    { name: 'GP6', x: 5, y: 78, signals: [i2c('SDA', 0)], description: 'Sensors SDA (I2C0)' },
    { name: 'GP7', x: 5, y: 86, signals: [i2c('SCL', 0)], description: 'Sensors SCL (I2C0)' },
    { name: 'GP8', x: 5, y: 94, signals: [], description: 'PDM Mic DATA' },
    { name: 'GP9', x: 5, y: 102, signals: [] },
    { name: 'GND', x: 5, y: 110, signals: [GND()] },
    { name: 'GP10', x: 5, y: 118, signals: [] },
    { name: 'GP11', x: 5, y: 126, signals: [] },
    { name: 'GP12', x: 5, y: 134, signals: [] },
    { name: 'GP13', x: 5, y: 142, signals: [] },
    { name: 'GND', x: 5, y: 150, signals: [GND()] },
    { name: 'GP14', x: 5, y: 158, signals: [], description: 'Red LED' },
    { name: 'GP15', x: 5, y: 166, signals: [] },

    // Right side (top to bottom)
    { name: 'VBUS', x: 59, y: 14, signals: [VCC()] },
    { name: 'VSYS', x: 59, y: 22, signals: [VCC()] },
    { name: 'GND', x: 59, y: 30, signals: [GND()] },
    { name: '3V3_EN', x: 59, y: 38, signals: [] },
    { name: '3V3', x: 59, y: 46, signals: [VCC(3.3)] },
    { name: 'ADC_VREF', x: 59, y: 54, signals: [] },
    { name: 'GP28', x: 59, y: 62, signals: [] },
    { name: 'GND', x: 59, y: 70, signals: [GND()] },
    { name: 'GP27', x: 59, y: 78, signals: [] },
    { name: 'GP26', x: 59, y: 86, signals: [] },
    { name: 'RUN', x: 59, y: 94, signals: [] },
    { name: 'GP22', x: 59, y: 102, signals: [], description: 'Button 2' },
    { name: 'GND', x: 59, y: 110, signals: [GND()] },
    { name: 'GP21', x: 59, y: 118, signals: [] },
    { name: 'GP20', x: 59, y: 126, signals: [] },
    { name: 'GP19', x: 59, y: 134, signals: [], description: 'Buzzer' },
    { name: 'GP18', x: 59, y: 142, signals: [], description: 'RGB LED Blue' },
    { name: 'GND', x: 59, y: 150, signals: [GND()] },
    { name: 'GP17', x: 59, y: 158, signals: [], description: 'RGB LED Green' },
    { name: 'GP16', x: 59, y: 166, signals: [], description: 'RGB LED Red' },
  ];

  static get styles() {
    return css`
      :host {
        display: inline-block;
      }

      .component-label {
        font-size: 4px;
        fill: #ffffff;
        font-family: monospace;
      }

      .module-icon {
        font-size: 4px;
        fill: #aabbcc;
        font-family: monospace;
      }

      .pin-label {
        font-size: 3px;
        fill: #eeeeee;
        font-family: monospace;
      }

      .board-title {
        font-size: 5px;
        fill: #ffffff;
        font-family: monospace;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      .clickable-element {
        cursor: pointer;
      }
    `;
  }

  constructor() {
    super();
    this.uniqueId = `pico-hat-${picoHatCounter++}`;
    this.clearOledDisplay();
  }

  // ------------------------------------------------------------------
  // SSD1306 OLED display buffer API
  // ------------------------------------------------------------------

  clearOledDisplay() {
    this.oledBuffer.fill(0x00);
    this.oledVersion++;
  }

  setOledPixel(x: number, y: number, value: boolean) {
    if (x < 0 || x >= 128 || y < 0 || y >= 64) return;
    const byteIndex = x + (y >> 3) * 128;
    const bitIndex = y & 7;

    if (value) {
      this.oledBuffer[byteIndex] |= 1 << bitIndex;
    } else {
      this.oledBuffer[byteIndex] &= ~(1 << bitIndex);
    }
    this.oledVersion++;
  }


  getOledPixel(x: number, y: number): boolean {
    if (x < 0 || x >= 128 || y < 0 || y >= 64) return false;
    const byteIndex = x + (y >> 3) * 128;
    const bitIndex = y & 7;
    return (this.oledBuffer[byteIndex] & (1 << bitIndex)) !== 0;
  }

  private getOledFont(): Record<string, number[]> {
    return {
      ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
      '!': [0x00, 0x00, 0x5f, 0x00, 0x00],
      '"': [0x00, 0x07, 0x00, 0x07, 0x00],
      '#': [0x14, 0x7f, 0x14, 0x7f, 0x14],
      $: [0x24, 0x2a, 0x7f, 0x2a, 0x12],
      '%': [0x23, 0x13, 0x08, 0x64, 0x62],
      '&': [0x36, 0x49, 0x55, 0x22, 0x50],
      "'": [0x00, 0x05, 0x03, 0x00, 0x00],
      '(': [0x00, 0x1c, 0x22, 0x41, 0x00],
      ')': [0x00, 0x41, 0x22, 0x1c, 0x00],
      '*': [0x14, 0x08, 0x3e, 0x08, 0x14],
      '+': [0x08, 0x08, 0x3e, 0x08, 0x08],
      ',': [0x00, 0x50, 0x30, 0x00, 0x00],
      '-': [0x08, 0x08, 0x08, 0x08, 0x08],
      '.': [0x00, 0x60, 0x60, 0x00, 0x00],
      '/': [0x20, 0x10, 0x08, 0x04, 0x02],
      '0': [0x3e, 0x51, 0x49, 0x45, 0x3e],
      '1': [0x00, 0x42, 0x7f, 0x40, 0x00],
      '2': [0x42, 0x61, 0x51, 0x49, 0x46],
      '3': [0x21, 0x41, 0x45, 0x4b, 0x31],
      '4': [0x18, 0x14, 0x12, 0x7f, 0x10],
      '5': [0x27, 0x45, 0x45, 0x45, 0x39],
      '6': [0x3c, 0x4a, 0x49, 0x49, 0x30],
      '7': [0x01, 0x71, 0x09, 0x05, 0x03],
      '8': [0x36, 0x49, 0x49, 0x49, 0x36],
      '9': [0x06, 0x49, 0x49, 0x29, 0x1e],
      ':': [0x00, 0x36, 0x36, 0x00, 0x00],
      ';': [0x00, 0x56, 0x36, 0x00, 0x00],
      '<': [0x08, 0x14, 0x22, 0x41, 0x00],
      '=': [0x14, 0x14, 0x14, 0x14, 0x14],
      '>': [0x00, 0x41, 0x22, 0x14, 0x08],
      '?': [0x02, 0x01, 0x51, 0x09, 0x06],
      '@': [0x32, 0x49, 0x79, 0x41, 0x3e],
      A: [0x7e, 0x11, 0x11, 0x11, 0x7e],
      B: [0x7f, 0x49, 0x49, 0x49, 0x36],
      C: [0x3e, 0x41, 0x41, 0x41, 0x22],
      D: [0x7f, 0x41, 0x41, 0x41, 0x3e],
      E: [0x7f, 0x49, 0x49, 0x49, 0x41],
      F: [0x7f, 0x09, 0x09, 0x09, 0x01],
      G: [0x3e, 0x41, 0x49, 0x49, 0x7a],
      H: [0x7f, 0x08, 0x08, 0x08, 0x7f],
      I: [0x00, 0x41, 0x7f, 0x41, 0x00],
      J: [0x20, 0x40, 0x41, 0x3f, 0x01],
      K: [0x7f, 0x08, 0x14, 0x22, 0x41],
      L: [0x7f, 0x40, 0x40, 0x40, 0x40],
      M: [0x7f, 0x02, 0x0c, 0x02, 0x7f],
      N: [0x7f, 0x04, 0x08, 0x10, 0x7f],
      O: [0x3e, 0x41, 0x41, 0x41, 0x3e],
      P: [0x7f, 0x09, 0x09, 0x09, 0x06],
      Q: [0x3e, 0x41, 0x51, 0x21, 0x5e],
      R: [0x7f, 0x09, 0x19, 0x29, 0x46],
      S: [0x46, 0x49, 0x49, 0x49, 0x31],
      T: [0x01, 0x01, 0x7f, 0x01, 0x01],
      U: [0x3f, 0x40, 0x40, 0x40, 0x3f],
      V: [0x1f, 0x20, 0x40, 0x20, 0x1f],
      W: [0x3f, 0x40, 0x30, 0x40, 0x3f],
      X: [0x63, 0x14, 0x08, 0x14, 0x63],
      Y: [0x07, 0x08, 0x70, 0x08, 0x07],
      Z: [0x61, 0x51, 0x49, 0x45, 0x43],
      '[': [0x00, 0x7f, 0x41, 0x41, 0x00],
      '\\': [0x02, 0x04, 0x08, 0x10, 0x20],
      ']': [0x00, 0x41, 0x41, 0x7f, 0x00],
      '^': [0x04, 0x02, 0x01, 0x02, 0x04],
      _: [0x40, 0x40, 0x40, 0x40, 0x40],
      '`': [0x00, 0x01, 0x02, 0x04, 0x00],
    };
  }

  private drawOledGlyph(charData: number[], x: number, y: number, size: number) {
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 8; row++) {
        if (charData[col] & (1 << row)) {
          for (let sx = 0; sx < size; sx++) {
            for (let sy = 0; sy < size; sy++) {
              this.setOledPixel(x + col * size + sx, y + row * size + sy, true);
            }
          }
        }
      }
    }
  }

  writeOledText(text: string, x: number, y: number, size = 1) {
    const font5x7 = this.getOledFont();
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      const charData = font5x7[char] || font5x7[' '];
      this.drawOledGlyph(charData, x + i * 6 * size, y, size);
    }
  }

  private rgbColor() {
    const r = Math.max(0, Math.min(1, this.rgbRed));
    const g = Math.max(0, Math.min(1, this.rgbGreen));
    const b = Math.max(0, Math.min(1, this.rgbBlue));
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }

  // ------------------------------------------------------------------
  // Rendering helpers
  // ------------------------------------------------------------------

  private renderPCB() {
    const leftPins = this.pinInfo.slice(0, 20);
    const rightPins = this.pinInfo.slice(20);

    return svg`
      <!-- Main PCB -->
      <rect x="0" y="0" width="64" height="176" rx="2" fill="#008000" />
      <rect x="1.5" y="1.5" width="61" height="173" rx="1.5" fill="#0a9040" />

      <!-- Board title -->
      <text x="32" y="172" class="board-title" text-anchor="middle">PICO HAT</text>


      <!-- Pin headers (left) -->
      ${leftPins.map(
        (pin) => svg`
        <circle cx="${pin.x}" cy="${pin.y}" r="2" fill="#d4af37" stroke="#8b7355"
          stroke-width="0.4" />
        <text x="${pin.x + 3.5}" y="${pin.y + 1.2}" class="pin-label">${pin.name}</text>
      `,
      )}

      <!-- Pin headers (right) -->
      ${rightPins.map(
        (pin) => svg`
        <circle cx="${pin.x}" cy="${pin.y}" r="2" fill="#d4af37" stroke="#8b7355"
          stroke-width="0.4" />
        <text x="${pin.x - 3.5}" y="${pin.y + 1.2}" class="pin-label" text-anchor="end">
          ${pin.name}</text>
      `,
      )}
    `;
  }

  private renderPicoW() {
    const ledOn = this.ledValue && this.ledBrightness > Number.EPSILON;

    return svg`
      <g transform="translate(32, 128)">
        <!-- Pico W module body -->
        <rect x="-15" y="-20" width="30" height="40" rx="2" fill="#16619d"
          stroke="#0e4a75" stroke-width="0.5" />
        <!-- RP2040 chip -->
        <rect x="-5" y="-8" width="10" height="10" rx="1" fill="#22222e"
          stroke="#555" stroke-width="0.4" />
        <text x="0" y="-2" class="module-icon" text-anchor="middle" font-size="3px">RP</text>
        <!-- USB micro connector -->
        <rect x="-4" y="-22" width="8" height="5" rx="0.8" fill="#8a8a9a"
          stroke="#666" stroke-width="0.4" />
        <rect x="-2.5" y="-20.5" width="5" height="2" rx="0.4" fill="#44444f" />
        <!-- WiFi antenna (bottom of module - Pico W) -->
        <rect x="-13" y="8" width="26" height="10" rx="1" fill="#0f4a80"
          stroke="#0d3a5c" stroke-width="0.4" />
        ${[-9, -4.5, 0, 4.5, 9].map(
          (cx) =>
            svg`<path d="M ${cx},10 L ${cx + 2.2},13 L ${cx},16 L ${cx - 2.2},13 Z"
              fill="#d0ae88" opacity="0.6" />`,
        )}
        <!-- onboard LED -->
        <circle cx="10" cy="-14" r="1.6"
          fill="${ledOn ? '#80ff80' : '#224422'}"
          opacity="${ledOn ? 0.9 : 0.5}"
          filter="${ledOn ? 'url(#ledGlow)' : ''}" />
        <text x="0" y="6.5" class="module-icon" text-anchor="middle" font-size="3.5px">
          PICO W</text>
      </g>
    `;
  }

  private renderOLED() {
    const pixels: { x: number; y: number }[] = [];

    if (this.oledEnabled && this.oledDisplayOn) {
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 128; x += 2) {
          if (this.getOledPixel(x, y) !== this.oledInverted) {
            pixels.push({ x, y });
          }
        }
      }
    }

    // 128x64 screen => 36x12.6 display area
    const xs = 36 / 128;
    const ys = 12.6 / 64;

    return svg`
      <g transform="translate(9, 6)">
        <!-- OLED module body (blue, like artwork) -->
        <path d="m 0,0 v 24 h 6 v -0.5 c 0,-0.6 0.5,-1.1 1.1,-1.1 h 24.8 c 0.6,0 1.1,0.5
          1.1,1.1 v 0.5 h 6 v -24 z" fill="#0f4d7c" />
        <!-- mounting holes -->
        <circle cx="1.9" cy="1.7" r="1.24" fill="#ffffff" stroke="#c8ceda" stroke-width="0.2" />
        <circle cx="37.1" cy="1.7" r="1.24" fill="#ffffff" stroke="#c8ceda" stroke-width="0.2" />
        <circle cx="1.9" cy="21" r="1.24" fill="#ffffff" stroke="#c8ceda" stroke-width="0.2" />
        <circle cx="37.1" cy="21" r="1.24" fill="#ffffff" stroke="#c8ceda" stroke-width="0.2" />
        <!-- 4-pin header GND VCC SCL SDA -->
        ${[0, 1, 2, 3].map(
          (i) => svg`
          <circle cx="${10 + i * 2.5}" cy="1.6" r="0.7" fill="none" stroke="#ecc98a"
            stroke-width="0.3" />
          <text x="${10 + i * 2.5}" y="${1.6 + 2.6}" class="pin-label" text-anchor="middle"
            font-size="2.2px" fill="#ffffff">${['GND', 'VCC', 'SCL', 'SDA'][i]}</text>
        `,
        )}
        <!-- screen frame + glass -->
        <rect x="0.4" y="4.2" width="38.2" height="14.8" fill="#000000" />
        <rect x="1.5" y="5.3" width="36" height="12.6" fill="#262628" />
        ${pixels.map(
          (p) =>
            svg`<rect x="${1.5 + p.x * xs}" y="${5.3 + p.y * ys}"
              width="${xs * 1.8}" height="${ys * 1.8}"
              fill="${this.oledInverted ? '#000000' : '#00d9ff'}"
              opacity="${this.oledContrast / 255}" />`,
        )}

        <!-- flex cable -->
        <rect x="12" y="19" width="15" height="2" fill="#ba8239" opacity="0.7" />
        <text x="19.5" y="26.5" class="component-label" text-anchor="middle" font-size="3px">
          SSD1306</text>
      </g>
    `;
  }

  private renderSensorModule() {
    const tiltX = Math.max(-1, Math.min(1, this.accelX));
    const tiltY = Math.max(-1, Math.min(1, this.accelY));
    const level = Math.max(0, Math.min(1, this.micLevel));
    const bars = Math.round(level * 4);

    return svg`
      <g transform="translate(12, 34)">
        <!-- module body (blue) -->
        <rect x="0" y="0" width="40" height="16" rx="1.5" fill="#16619d"
          stroke="#0e4a75" stroke-width="0.5" />
        <!-- header pin circles -->
        ${[0, 1, 2, 3, 4, 5].map(
          (i) =>
            svg`<circle cx="${3 + i * 6.6}" cy="1.6" r="0.8" fill="none"
                stroke="#d0ae88" stroke-width="0.4" />`,
        )}
        <!-- ICM42670 IMU chip -->
        <rect x="3" y="4" width="10" height="8" rx="0.8" fill="#0d3a5c"
          stroke="#092c47" stroke-width="0.4" />
        <circle cx="${8 + tiltX * 2.5}" cy="${8 + tiltY * 2}" r="1" fill="#80cfff"
          opacity="0.9" />
        <text x="8" y="15" class="module-icon" text-anchor="middle" font-size="2.4px">
          ICM42670</text>
        <!-- VEML6030 light sensor -->
        <rect x="15" y="4" width="8" height="8" rx="0.8" fill="#2c3e50"
          stroke="#1a252f" stroke-width="0.4" />
        <circle cx="19" cy="8" r="2" fill="#0f1c2e" />
        <circle cx="19" cy="8" r="0.8" fill="#6e92b8" opacity="0.7" />
        <text x="19" y="15" class="module-icon" text-anchor="middle" font-size="2.4px">
          VEML</text>
        <!-- HDC2021 temp/humidity -->
        <rect x="25" y="4" width="7" height="8" rx="0.8" fill="#0d3a5c"
          stroke="#092c47" stroke-width="0.4" />
        <path d="m 28.5,5 l 1.2,2.2 h -2.4 z" fill="#80cfff" opacity="0.7" />
        <text x="28.5" y="15" class="module-icon" text-anchor="middle" font-size="2.4px">
          HDC</text>
        <!-- PDM microphone -->
        <circle cx="36.5" cy="8" r="3" fill="#2c3e50" stroke="#1a252f" stroke-width="0.4" />
        <circle cx="36.5" cy="8" r="1.8" fill="#0f1c2e" />
        <circle cx="36.5" cy="8" r="0.7" fill="#3d566e" />
        ${[0, 1, 2, 3].map((i) => {
          const h = 1 + i * 0.7;
          const active = i < bars;
          return svg`<rect x="${32.5 + i * 2}" y="${8 - h}" width="1.4" height="${h}"
              fill="${active ? '#2ecc71' : '#1e3d2b'}" rx="0.3" />`;
        })}
        <text x="36.5" y="15" class="module-icon" text-anchor="middle" font-size="2.4px">
          MIC</text>
      </g>
    `;
  }

  private renderButtons() {
    return svg`
      <!-- Button 1 - red dome (left edge, below header area) -->
      <g transform="translate(15, 58)" class="clickable-element" id="button1">
        <rect x="-5" y="-5" width="10" height="10" rx="0.5" fill="#464646" />
        <rect x="-4.5" y="-4.5" width="9" height="9" rx="0.3" fill="#eaeaea" />
        <circle cx="0" cy="0" r="3.8" fill="url(#gradBtn1)" />
        <circle cx="0" cy="0" r="2.9" fill="#ff0000" stroke="#2f2f2f"
          stroke-opacity="0.47" stroke-width="0.4" />
        ${
          this.button1Pressed
            ? svg`<circle cx="0" cy="0" r="3.2" fill="#ff5555" opacity="0.75" />`
            : ''
        }
        <text x="-9" y="2" class="component-label" font-size="3.5px">BTN1</text>
      </g>

      <!-- Button 2 - red dome (left edge, below button 1) -->
      <g transform="translate(15, 76)" class="clickable-element" id="button2">
        <rect x="-5" y="-5" width="10" height="10" rx="0.5" fill="#464646" />
        <rect x="-4.5" y="-4.5" width="9" height="9" rx="0.3" fill="#eaeaea" />
        <circle cx="0" cy="0" r="3.8" fill="url(#gradBtn2)" />
        <circle cx="0" cy="0" r="2.9" fill="#ff0000" stroke="#2f2f2f"
          stroke-opacity="0.47" stroke-width="0.4" />
        ${
          this.button2Pressed
            ? svg`<circle cx="0" cy="0" r="3.2" fill="#ff5555" opacity="0.75" />`
            : ''
        }
        <text x="-9" y="2" class="component-label" font-size="3.5px">BTN2</text>
      </g>
    `;
  }

  private renderRedLED() {
    const lightOn = this.ledValue && this.ledBrightness > Number.EPSILON;
    const opacity = this.ledBrightness ? 0.3 + this.ledBrightness * 0.7 : 0;

    return svg`
      <g transform="translate(51, 58)">
        <rect x="-1" y="4" width="2" height="4" fill="#8c8c8c" />
        <path d="m -2.2,-2.5 v -2.5 a 2.2,2.2 0 0 1 4.4,0 v 4.5 c -0.5,0.8 -1.3,1.2
          -2.2,1.2 -0.9,0 -1.7,-0.4 -2.2,-1.2 z" fill="#ff8080" opacity="0.7" />
        <path d="m -2.2,-2.5 v -2.5 a 2.2,2.2 0 0 1 4.4,0 v 4.5 c -0.5,0.8 -1.3,1.2
          -2.2,1.2 -0.9,0 -1.7,-0.4 -2.2,-1.2 z" fill="#e6e6e6" opacity="0.3" />
        ${
          lightOn
            ? svg`
          <circle cx="0" cy="-1.5" r="5" fill="#ff4040" opacity="${opacity}"
            filter="url(#light2-${this.uniqueId})" />
          <circle cx="0" cy="-1.5" r="1.5" fill="white" filter="url(#light1-${this.uniqueId})" />
        `
            : ''
        }
        <text x="-5" y="10" class="component-label" font-size="3.5px">LED</text>
      </g>
    `;
  }

  private renderRGBLED() {
    const brightness = Math.max(this.rgbRed, this.rgbGreen, this.rgbBlue, 0.001);
    const lit = brightness > 0.01;
    const color = this.rgbColor();
    const opacity = lit ? 0.25 + brightness * 0.65 : 0;

    return svg`
      <g transform="translate(51, 78)">
        <circle cx="0" cy="0" r="3.5" fill="#e8e8e8" opacity="0.5" />
        <circle cx="0" cy="0" r="2.4" fill="#cccccc" opacity="0.5" />
        ${
          lit
            ? svg`
          <circle cx="0" cy="0" r="5" fill="${color}" opacity="${opacity}"
            filter="url(#light2-${this.uniqueId})" />
          <circle cx="0" cy="0" r="1.6" fill="${color}" />
          <circle cx="-0.5" cy="-0.5" r="0.8" fill="#ffffff" opacity="0.8" />
        `
            : ''
        }
        <text x="-6" y="8" class="component-label" font-size="3.5px">RGB</text>
      </g>
    `;
  }

  private renderBuzzer() {
    return svg`
      <g transform="translate(32, 99)">
        <!-- ringed buzzer body like artwork -->
        <circle cx="0" cy="0" r="9" fill="#1a1a1a" stroke="#000000" stroke-width="0.7" />
        <circle cx="0" cy="0" r="7" fill="none" stroke="#000000" stroke-width="0.3" />
        <circle cx="0" cy="0" r="4.8" fill="none" stroke="#000000" stroke-width="0.3" />
        <circle cx="0" cy="0" r="1.4" fill="#cccccc" stroke="#000000" stroke-width="0.25" />
        ${
          this.buzzerSignal
            ? svg`
          <path d="M 10,-5 Q 13,0 10,5" stroke="#3498db" stroke-width="1"
            fill="none" opacity="0.8" />
          <path d="M 12.5,-8 Q 17,0 12.5,8" stroke="#3498db" stroke-width="0.8"
            fill="none" opacity="0.5" />
        `
            : ''
        }
        <text x="-6" y="15" class="component-label" font-size="3.5px">BZR</text>
      </g>
    `;
  }

  private renderExtraMicrophoneHole() {
    return svg`
      <!-- decorative solder pads area near bottom (keeps layout close to artwork) -->
      <g transform="translate(32, 158)">
        ${[0, 1, 2, 3, 4, 5].map(
          (i) =>
            svg`<circle cx="${-16 + i * 6.4}" cy="0" r="0.9" fill="#d4af37"
                stroke="#8b7355" stroke-width="0.3" opacity="0.8" />`,
        )}
      </g>
    `;
  }

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has('oledEnabled')) {
      this.oledVersion++;
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  renderSVG() {
    return svg`
      <svg width="128" height="352" viewBox="0 0 64 176" xmlns="http://www.w3.org/2000/svg">

        <defs>
          <filter id="ledGlow" x="-1" y="-1" width="3" height="3">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          <filter id="light1-${this.uniqueId}" x="-1.2" y="-1.2" width="3.4" height="3.4">
            <feGaussianBlur stdDeviation="1" />
          </filter>
          <filter id="light2-${this.uniqueId}" x="-0.5" y="-0.5" width="2" height="2">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <radialGradient id="gradBtn1" cx="0.35" cy="0.35" r="0.9">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="30%" stop-color="#ff0000" />
            <stop offset="60%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#aa0000" />
          </radialGradient>
          <radialGradient id="gradBtn2" cx="0.35" cy="0.35" r="0.9">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="30%" stop-color="#ff0000" />
            <stop offset="60%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#aa0000" />
          </radialGradient>
        </defs>

        ${this.renderPCB()}
        ${this.renderOLED()}
        ${this.renderSensorModule()}
        ${this.renderButtons()}
        ${this.renderRedLED()}
        ${this.renderRGBLED()}
        ${this.renderBuzzer()}
        ${this.renderPicoW()}
        ${this.renderExtraMicrophoneHole()}
      </svg>
    `;
  }

  render() {
    return this.renderSVG();
  }

  // ------------------------------------------------------------------
  // Button events
  // ------------------------------------------------------------------

  private readonly handleButton1Down = () => {
    if (!this.button1Pressed) {
      this.button1Pressed = true;
      this.dispatchEvent(
        new CustomEvent('button1-press', { detail: { pin: 'GP2', pressed: true } }),
      );
    }
  };

  private readonly handleButton1Up = () => {
    if (this.button1Pressed) {
      this.button1Pressed = false;
      this.dispatchEvent(
        new CustomEvent('button1-release', { detail: { pin: 'GP2', pressed: false } }),
      );
    }
  };

  private readonly handleButton2Down = () => {
    if (!this.button2Pressed) {
      this.button2Pressed = true;
      this.dispatchEvent(
        new CustomEvent('button2-press', { detail: { pin: 'GP22', pressed: true } }),
      );
    }
  };

  private readonly handleButton2Up = () => {
    if (this.button2Pressed) {
      this.button2Pressed = false;
      this.dispatchEvent(
        new CustomEvent('button2-release', { detail: { pin: 'GP22', pressed: false } }),
      );
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mousedown', this.handleButtonInteraction);
    this.addEventListener('mouseup', this.handleButtonRelease);
    this.addEventListener('touchstart', this.handleButtonInteraction);
    this.addEventListener('touchend', this.handleButtonRelease);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('mousedown', this.handleButtonInteraction);
    this.removeEventListener('mouseup', this.handleButtonRelease);
    this.removeEventListener('touchstart', this.handleButtonInteraction);
    this.removeEventListener('touchend', this.handleButtonRelease);
  }

  private readonly handleButtonInteraction = (e: MouseEvent | TouchEvent) => {
    // Inside the shadow DOM, `e.target` is retargeted to the host element, so
    // `closest('.clickable-element')` on it always misses. Use composedPath()[0]
    // (the real innermost target) instead; fall back to e.target / the touch point.
    let source: EventTarget | Element | null = null;
    if (typeof e.composedPath === 'function') {
      source = e.composedPath()[0] as Element | null;
      if (!source && e instanceof TouchEvent && e.touches.length) {
        const t = e.touches[0];
        source = document.elementFromPoint(t.clientX, t.clientY);
      }
    }
    const target = (source ?? e.target) as Element | null;
    const clickable = target?.closest?.('.clickable-element') as SVGGElement | null;

    if (clickable?.id === 'button1') {
      this.handleButton1Down();
    } else if (clickable?.id === 'button2') {
      this.handleButton2Down();
    }
  };

  private readonly handleButtonRelease = () => {
    this.handleButton1Up();
    this.handleButton2Up();
  };
}
