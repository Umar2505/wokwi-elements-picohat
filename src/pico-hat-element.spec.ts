import { describe, it, expect, beforeEach } from 'vitest';
import { PicoHatElement } from './pico-hat-element';
import { renderToPng, savePng } from './utils/test-utils';

describe('PicoHatElement', () => {
  let element: PicoHatElement;

  beforeEach(() => {
    element = new PicoHatElement();
  });

  it('should render to svg', async () => {
    const pngData = await renderToPng(element, PicoHatElement.styles);
    await savePng('wokwi-pico-hat', pngData);
  });

  it('should render with all components active', async () => {
    element.ledValue = true;
    element.rgbRed = 0.5;
    element.rgbGreen = 0.2;
    element.rgbBlue = 1;
    element.buzzerSignal = true;
    element.button1Pressed = true;
    element.micLevel = 0.75;
    element.clearOledDisplay();
    element.writeOledText('PICO HAT', 4, 28, 1);
    const pngData = await renderToPng(element, PicoHatElement.styles);
    await savePng('wokwi-pico-hat-active', pngData);
  });

  it('should have correct pin count (40-pin Pico W)', () => {
    expect(element.pinInfo.length).toBe(40);
  });

  it('should have GND pins', () => {
    const gndPins = element.pinInfo.filter((pin) => pin.name === 'GND');
    expect(gndPins.length).toBeGreaterThan(0);
  });

  it('should have power pins', () => {
    const powerPins = element.pinInfo.filter(
      (pin) => pin.name === 'VBUS' || pin.name === 'VSYS' || pin.name === '3V3',
    );
    expect(powerPins.length).toBeGreaterThan(0);
  });

  it('should have all GPIO pins', () => {
    const gpioPins = element.pinInfo.filter((pin) => pin.name.startsWith('GP'));
    expect(gpioPins.length).toBeGreaterThanOrEqual(20);
  });

  describe('Pin mapping', () => {
    const findPin = (el: PicoHatElement, name: string) =>
      el.pinInfo.find((pin) => pin.name === name);

    it('should have GP14 for the red LED', () => {
      expect(findPin(element, 'GP14')?.description).toBe('Red LED');
    });

    it('should have GP2 for Button 1', () => {
      expect(findPin(element, 'GP2')?.description).toBe('Button 1');
    });

    it('should have GP22 for Button 2', () => {
      expect(findPin(element, 'GP22')?.description).toBe('Button 2');
    });

    it('should have GP19 for the Buzzer', () => {
      expect(findPin(element, 'GP19')?.description).toBe('Buzzer');
    });

    it('should have GP16/GP17/GP18 for the RGB LED', () => {
      expect(findPin(element, 'GP16')?.description).toContain('RGB LED Red');
      expect(findPin(element, 'GP17')?.description).toContain('RGB LED Green');
      expect(findPin(element, 'GP18')?.description).toContain('RGB LED Blue');
    });

    it('should have I2C0 pins (GP6/GP7) for the on-board sensors', () => {
      const sda = findPin(element, 'GP6');
      const scl = findPin(element, 'GP7');
      expect(sda?.description).toBe('Sensors SDA (I2C0)');
      expect(scl?.description).toBe('Sensors SCL (I2C0)');
      expect(sda?.signals[0]).toMatchObject({ type: 'i2c', signal: 'SDA', bus: 0 });
      expect(scl?.signals[0]).toMatchObject({ type: 'i2c', signal: 'SCL', bus: 0 });
    });

    it('should have I2C1 pins (GP4/GP5) for the SSD1306 OLED', () => {
      const sda = findPin(element, 'GP4');
      const scl = findPin(element, 'GP5');
      expect(sda?.description).toBe('OLED SDA (I2C1)');
      expect(scl?.description).toBe('OLED SCL (I2C1)');
      expect(sda?.signals[0]).toMatchObject({ type: 'i2c', signal: 'SDA', bus: 1 });
      expect(scl?.signals[0]).toMatchObject({ type: 'i2c', signal: 'SCL', bus: 1 });
    });

    it('should have GP3 for the PDM microphone clock', () => {
      expect(findPin(element, 'GP3')?.description).toBe('PDM Mic CLK');
    });
  });

  describe('initialization', () => {
    it('should initialize with red LED off', () => {
      expect(element.ledValue).toBe(false);
    });

    it('should initialize RGB LED channels to 0', () => {
      expect(element.rgbRed).toBe(0);
      expect(element.rgbGreen).toBe(0);
      expect(element.rgbBlue).toBe(0);
    });

    it('should initialize buttons not pressed', () => {
      expect(element.button1Pressed).toBe(false);
      expect(element.button2Pressed).toBe(false);
    });

    it('should initialize with buzzer off', () => {
      expect(element.buzzerSignal).toBe(false);
    });

    it('should initialize with OLED enabled', () => {
      expect(element.oledEnabled).toBe(true);
    });

    it('should initialize sensor defaults', () => {
      expect(element.temperature).toBe(25);
      expect(element.humidity).toBe(50);
      expect(element.ambientLight).toBe(0);
      expect(element.accelZ).toBe(1);
      expect(element.micLevel).toBe(0);
    });
  });

  describe('OLED Display', () => {
    it('should clear OLED display', () => {
      element.setOledPixel(10, 10, true);
      element.clearOledDisplay();
      expect(element.getOledPixel(10, 10)).toBe(false);
    });

    it('should set and get pixels', () => {
      element.setOledPixel(50, 30, true);
      expect(element.getOledPixel(50, 30)).toBe(true);

      element.setOledPixel(50, 30, false);
      expect(element.getOledPixel(50, 30)).toBe(false);
    });

    it('should handle out of bounds pixels', () => {
      element.setOledPixel(-1, -1, true);
      element.setOledPixel(200, 200, true);
      expect(element.getOledPixel(-1, -1)).toBe(false);
      expect(element.getOledPixel(200, 200)).toBe(false);
    });

    it('should write text to OLED', () => {
      element.clearOledDisplay();
      element.writeOledText('A', 0, 0, 1);
      let pixelSet = false;
      for (let x = 0; x < 10 && !pixelSet; x++) {
        for (let y = 0; y < 10 && !pixelSet; y++) {
          if (element.getOledPixel(x, y)) {
            pixelSet = true;
          }
        }
      }
      expect(pixelSet).toBe(true);
    });

    it('should handle different text sizes', () => {
      element.clearOledDisplay();
      element.writeOledText('TEST', 10, 10, 2);
      expect(element.getOledPixel(10, 10)).toBeDefined();
    });
  });

  describe('Red LED functionality', () => {
    it('should toggle LED value', () => {
      element.ledValue = true;
      expect(element.ledValue).toBe(true);
      element.ledValue = false;
      expect(element.ledValue).toBe(false);
    });

    it('should set LED brightness', () => {
      element.ledBrightness = 0.5;
      expect(element.ledBrightness).toBe(0.5);
    });
  });

  describe('RGB LED functionality', () => {
    it('should set RGB channels', () => {
      element.rgbRed = 1;
      element.rgbGreen = 0.5;
      element.rgbBlue = 0.25;
      expect(element.rgbRed).toBe(1);
      expect(element.rgbGreen).toBe(0.5);
      expect(element.rgbBlue).toBe(0.25);
    });
  });

  describe('Sensor properties', () => {
    it('should set VEML6030 ambient light', () => {
      element.ambientLight = 350;
      expect(element.ambientLight).toBe(350);
    });

    it('should set HDC2021 temperature and humidity', () => {
      element.temperature = 22.5;
      element.humidity = 60;
      expect(element.temperature).toBe(22.5);
      expect(element.humidity).toBe(60);
    });

    it('should set ICM42670 acceleration and rotation', () => {
      element.accelX = 0.5;
      element.accelY = -0.5;
      element.gyroZ = 45;
      expect(element.accelX).toBe(0.5);
      expect(element.accelY).toBe(-0.5);
      expect(element.gyroZ).toBe(45);
    });

    it('should set PDM microphone level', () => {
      element.micLevel = 0.8;
      expect(element.micLevel).toBe(0.8);
    });
  });

  describe('Button events', () => {
    it('should dispatch button1-press event', async () => {
      await new Promise<void>((resolve) => {
        element.addEventListener('button1-press', (e: Event) => {
          const detail = (e as CustomEvent).detail;
          expect(detail.pin).toBe('GP2');
          expect(detail.pressed).toBe(true);
          resolve();
        });
        element.button1Pressed = false;
        element['handleButton1Down']();
      });
    });

    it('should dispatch button1-release event', async () => {
      await new Promise<void>((resolve) => {
        element.addEventListener('button1-release', (e: Event) => {
          const detail = (e as CustomEvent).detail;
          expect(detail.pin).toBe('GP2');
          expect(detail.pressed).toBe(false);
          resolve();
        });
        element.button1Pressed = true;
        element['handleButton1Up']();
      });
    });

    it('should dispatch button2-press event', async () => {
      await new Promise<void>((resolve) => {
        element.addEventListener('button2-press', (e: Event) => {
          const detail = (e as CustomEvent).detail;
          expect(detail.pin).toBe('GP22');
          expect(detail.pressed).toBe(true);
          resolve();
        });
        element.button2Pressed = false;
        element['handleButton2Down']();
      });
    });

    it('should dispatch button2-release event', async () => {
      await new Promise<void>((resolve) => {
        element.addEventListener('button2-release', (e: Event) => {
          const detail = (e as CustomEvent).detail;
          expect(detail.pin).toBe('GP22');
          expect(detail.pressed).toBe(false);
          resolve();
        });
        element.button2Pressed = true;
        element['handleButton2Up']();
      });
    });
  });

  describe('Buzzer functionality', () => {
    it('should toggle buzzer signal', () => {
      element.buzzerSignal = true;
      expect(element.buzzerSignal).toBe(true);
      element.buzzerSignal = false;
      expect(element.buzzerSignal).toBe(false);
    });
  });
});
