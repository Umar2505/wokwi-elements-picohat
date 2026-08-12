import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { action } from 'storybook/actions';
import type { PicoHatElement } from './pico-hat-element';
import './pico-hat-element';

interface PicoHatArgs {
  ledValue: boolean;
  ledBrightness: number;
  rgbRed: number;
  rgbGreen: number;
  rgbBlue: number;
  button1Pressed: boolean;
  button2Pressed: boolean;
  buzzerSignal: boolean;
  ambientLight: number;
  temperature: number;
  humidity: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  micLevel: number;
  oledEnabled: boolean;
}

const meta = {
  title: 'Pico HAT',
  component: 'wokwi-pico-hat',
  parameters: {
    docs: {
      description: {
        component:
          'A comprehensive development HAT for the Raspberry Pi Pico W. ' +
          'Includes VEML6030 (ambient light), HDC2021 (temp/hum), PDM microphone, ' +
          'ICM42670 (accel/gyro), 2 buttons, RGB LED, red LED, buzzer, and an SSD1306 OLED display.',
      },
    },
  },
  argTypes: {
    ledValue: { control: 'boolean', description: 'Red LED state (GP14)' },
    ledBrightness: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Red LED brightness',
    },
    rgbRed: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'RGB LED red channel (GP16)',
    },
    rgbGreen: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'RGB LED green channel (GP17)',
    },
    rgbBlue: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'RGB LED blue channel (GP18)',
    },
    button1Pressed: { control: 'boolean', description: 'Button 1 state (GP2)' },
    button2Pressed: { control: 'boolean', description: 'Button 2 state (GP22)' },
    buzzerSignal: { control: 'boolean', description: 'Buzzer signal (GP19)' },
    ambientLight: {
      control: { type: 'range', min: 0, max: 1000, step: 10 },
      description: 'VEML6030 ambient light (lux)',
    },
    temperature: {
      control: { type: 'range', min: -40, max: 125, step: 0.5 },
      description: 'HDC2021 temperature (°C)',
    },
    humidity: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'HDC2021 humidity (%RH)',
    },
    accelX: {
      control: { type: 'range', min: -2, max: 2, step: 0.1 },
      description: 'ICM42670 accel X (g)',
    },
    accelY: {
      control: { type: 'range', min: -2, max: 2, step: 0.1 },
      description: 'ICM42670 accel Y (g)',
    },
    accelZ: {
      control: { type: 'range', min: -2, max: 2, step: 0.1 },
      description: 'ICM42670 accel Z (g)',
    },
    micLevel: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'PDM mic level',
    },
    oledEnabled: { control: 'boolean', description: 'SSD1306 OLED enabled' },
  },
  args: {
    ledValue: false,
    ledBrightness: 1,
    rgbRed: 0,
    rgbGreen: 0,
    rgbBlue: 0,
    button1Pressed: false,
    button2Pressed: false,
    buzzerSignal: false,
    ambientLight: 300,
    temperature: 25,
    humidity: 50,
    accelX: 0,
    accelY: 0,
    accelZ: 1,
    micLevel: 0,
    oledEnabled: true,
  },
} satisfies Meta<PicoHatArgs>;

export default meta;
type Story = StoryObj<PicoHatArgs>;

const renderHat = (args: PicoHatArgs) => html`
  <wokwi-pico-hat
    .ledValue=${args.ledValue}
    .ledBrightness=${args.ledBrightness}
    .rgbRed=${args.rgbRed}
    .rgbGreen=${args.rgbGreen}
    .rgbBlue=${args.rgbBlue}
    .button1Pressed=${args.button1Pressed}
    .button2Pressed=${args.button2Pressed}
    .buzzerSignal=${args.buzzerSignal}
    .ambientLight=${args.ambientLight}
    .temperature=${args.temperature}
    .humidity=${args.humidity}
    .accelX=${args.accelX}
    .accelY=${args.accelY}
    .accelZ=${args.accelZ}
    .micLevel=${args.micLevel}
    .oledEnabled=${args.oledEnabled}
    @button1-press=${action('button1-press')}
    @button1-release=${action('button1-release')}
    @button2-press=${action('button2-press')}
    @button2-release=${action('button2-release')}
  ></wokwi-pico-hat>
`;

export const Default: Story = {
  render: (args) => renderHat(args),
};

export const AllActive: Story = {
  args: {
    ledValue: true,
    rgbRed: 0.2,
    rgbGreen: 0.6,
    rgbBlue: 1,
    buzzerSignal: true,
    button1Pressed: true,
    micLevel: 0.8,
    ambientLight: 800,
  },
  render: (args) => renderHat(args),
};

export const RGBColors: Story = {
  render: () => html`
    <div style="display:flex;gap:24px;flex-wrap:wrap;text-align:center">
      <div>
        <wokwi-pico-hat .rgbRed=${1}></wokwi-pico-hat>
        <p>Red</p>
      </div>
      <div>
        <wokwi-pico-hat .rgbGreen=${1}></wokwi-pico-hat>
        <p>Green</p>
      </div>
      <div>
        <wokwi-pico-hat .rgbBlue=${1}></wokwi-pico-hat>
        <p>Blue</p>
      </div>
      <div>
        <wokwi-pico-hat .rgbRed=${1} .rgbGreen=${1}></wokwi-pico-hat>
        <p>Yellow</p>
      </div>
      <div>
        <wokwi-pico-hat .rgbRed=${1} .rgbBlue=${1}></wokwi-pico-hat>
        <p>Magenta</p>
      </div>
      <div>
        <wokwi-pico-hat .rgbGreen=${1} .rgbBlue=${1}></wokwi-pico-hat>
        <p>Cyan</p>
      </div>
      <div>
        <wokwi-pico-hat .rgbRed=${1} .rgbGreen=${1} .rgbBlue=${1}></wokwi-pico-hat>
        <p>White</p>
      </div>
    </div>
  `,
};

export const WithOLEDText: Story = {
  render: (args) => {
    const updateOLED = (element: PicoHatElement) => {
      if (element) {
        element.clearOledDisplay();
        element.writeOledText('PICO HAT', 20, 4, 2);
        element.writeOledText('VEML6030 HDC2021', 4, 28, 1);
        element.writeOledText('ICM42670 + OLED', 4, 40, 1);
        element.writeOledText('MIC BTN RGB BZR', 4, 52, 1);
      }
    };
    return html`
      <wokwi-pico-hat
        ${ref((el) => el && updateOLED(el as PicoHatElement))}
        .ledValue=${args.ledValue}
        .rgbGreen=${args.rgbGreen}
        .buzzerSignal=${args.buzzerSignal}
      ></wokwi-pico-hat>
    `;
  },
};

export const ButtonsPressed: Story = {
  args: { button1Pressed: true, button2Pressed: true },
  render: (args) => renderHat(args),
};

export const IMUTilt: Story = {
  render: () => html`
    <div style="display:flex;gap:24px;flex-wrap:wrap;text-align:center">
      <div>
        <wokwi-pico-hat></wokwi-pico-hat>
        <p>Level</p>
      </div>
      <div>
        <wokwi-pico-hat .accelX=${1}></wokwi-pico-hat>
        <p>Tilt +X</p>
      </div>
      <div>
        <wokwi-pico-hat .accelY=${-1}></wokwi-pico-hat>
        <p>Tilt -Y</p>
      </div>
      <div>
        <wokwi-pico-hat .accelX=${-1} .accelY=${1}></wokwi-pico-hat>
        <p>Tilt diag</p>
      </div>
    </div>
  `,
};

export const MicLevels: Story = {
  render: () => html`
    <div style="display:flex;gap:24px;flex-wrap:wrap;text-align:center">
      <div>
        <wokwi-pico-hat .micLevel=${0}></wokwi-pico-hat>
        <p>Silent</p>
      </div>
      <div>
        <wokwi-pico-hat .micLevel=${0.25}></wokwi-pico-hat>
        <p>Quiet</p>
      </div>
      <div>
        <wokwi-pico-hat .micLevel=${0.6}></wokwi-pico-hat>
        <p>Medium</p>
      </div>
      <div>
        <wokwi-pico-hat .micLevel=${1}></wokwi-pico-hat>
        <p>Loud</p>
      </div>
    </div>
  `,
};

export const Interactive: Story = {
  render: () => {
    let hat: PicoHatElement | null = null;
    let ledState = false;
    let counter = 0;

    const updateDisplay = () => {
      if (hat) {
        hat.clearOledDisplay();
        hat.writeOledText('PICO HAT DEMO', 10, 4, 1);
        hat.writeOledText(`COUNT: ${counter}`, 10, 20, 1);
        hat.writeOledText(`LED: ${ledState ? 'ON' : 'OFF'}`, 10, 32, 1);
        hat.writeOledText(`BTN TO TOGGLE`, 10, 52, 1);
      }
    };

    const handleButton = () => {
      ledState = !ledState;
      if (hat) {
        hat.ledValue = ledState;
        hat.rgbGreen = ledState ? 0.8 : 0;
        counter++;
        updateDisplay();
      }
    };

    return html`
      <div>
        <wokwi-pico-hat
          ${ref((el) => {
            hat = el as PicoHatElement | null;
            updateDisplay();
          })}
          @button1-press=${handleButton}
          @button2-press=${handleButton}
        ></wokwi-pico-hat>
        <p style="font-family:monospace">
          Click BTN1 or BTN2 on the board to toggle the LED + RGB.
        </p>
      </div>
    `;
  },
};
