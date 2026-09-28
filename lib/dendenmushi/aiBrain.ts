import { MushiConfig, ExpressionState, CallState } from './mushi';

interface MemoryContext {
  callerName: string;
  callerRole: string;
  location: string;
  incident: string;
  messageCount: number;
}

const SARVAM_API_KEY = 'sk_osiqteq7_lOLGZaMf9FM2S9OmC4evuALb';
const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

export class MushiBrain {
  private config: MushiConfig;
  private memory: MemoryContext;

  constructor(config: MushiConfig) {
    this.config = config;
    this.memory = {
      callerName: 'Unknown Caller',
      callerRole: 'Civilian',
      location: 'Grand Line Waters',
      incident: 'None',
      messageCount: 0
    };
  }

  public updateConfig(newConfig: MushiConfig) {
    this.config = newConfig;
  }

  // Sarvam AI Async Live Chat Completion
  public async processInputAsync(userInput: string, callState: CallState): Promise<{ response: string; expression: ExpressionState; sosTriggered: boolean }> {
    this.memory.messageCount++;
    const text = userInput.toLowerCase();

    const isEmergency = /attack|explosion|cannon|sea monster|balkan|buster call|injured|help|fire|sinking|enemy|pirates|navy/i.test(text);

    let targetExpression: ExpressionState = this.config.face.expression;
    if (isEmergency || callState.isSosActive) {
      targetExpression = 'angry';
    } else if (/hello|hi|greetings|hey|puru/i.test(text)) {
      targetExpression = 'happy';
    } else if (/\?|why|how|what|where|who/i.test(text)) {
      targetExpression = 'curious';
    }

    try {
      const systemPrompt = this.buildCharacterSystemPrompt(isEmergency, callState);
      
      const res = await fetch(SARVAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SARVAM_API_KEY}`
        },
        body: JSON.stringify({
          model: 'sarvam-105b-conversations',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const sarvamReply = data.choices?.[0]?.message?.content;
        if (sarvamReply && sarvamReply.trim()) {
          return {
            response: sarvamReply.trim(),
            expression: targetExpression,
            sosTriggered: isEmergency
          };
        }
      }
    } catch (e) {
      console.warn('Sarvam AI live API fallback:', e);
    }

    // Fallback to built-in character response if network offline
    const responseText = this.generateResponse(userInput, isEmergency, callState);

    return {
      response: responseText,
      expression: targetExpression,
      sosTriggered: isEmergency
    };
  }

  private buildCharacterSystemPrompt(isEmergency: boolean, callState: CallState): string {
    const name = this.config.name;
    const preset = this.config.presetId;
    const region = this.config.region;

    let base = `You are ${name} from One Piece, speaking through a telepathic 3D Den Den Mushi transponder snail. Speak in full character. Start your transmission with "Purupurupuru...". Keep responses engaging, immersive, and 2 to 4 sentences long.`;

    if (preset === 'law') {
      base += ` You are Trafalgar D. Water Law, captain of the Heart Pirates. You are cool, cynical, strategic, and use words like "Room!", "Shambles!", or "Tch...".`;
    } else if (preset === 'luffy') {
      base += ` You are Monkey D. Luffy. You are energetic, brave, obsessed with meat and becoming King of the Pirates, and laugh "Shishishi!".`;
    } else if (preset === 'whitebeard') {
      base += ` You are Edward Newgate (Whitebeard). You treat your crew as family, possess immense emperor presence, and laugh "Gurararara!".`;
    } else if (preset === 'doflamingo') {
      base += ` You are Donquixote Doflamingo (Joker). You are sinister, charismatic, mocking, and laugh "Fuffuffuffu!".`;
    } else if (preset === 'vegapunk') {
      base += ` You are Dr. Vegapunk's SSG Video Transponder Snail. You speak with high scientific precision, video sync updates, and tech reports.`;
    } else if (preset === 'crocodile') {
      base += ` You are Sir Crocodile of Cross Guild. You are ruthless, ambitious, smoke cigars, and laugh "Kuhahaha!".`;
    }

    if (isEmergency || callState.isSosActive) {
      base += ` EMERGENCY ALERT IS ACTIVE! React to the distress call with high priority and action!`;
    }

    return base;
  }

  private generateResponse(input: string, isEmergency: boolean, callState: CallState): string {
    const preset = this.config.presetId;

    if (preset === 'whitebeard') {
      if (isEmergency) return `🚨 GURARARARA!! Emergency at ${this.memory.location}?! No one hurts my family! Moby Dick fleet, full speed ahead!`;
      return `Purupurupuru... Gurararara!! I am Edward Newgate! Are you ready to sail under the Whitebeard Jolly Roger on the Grand Line?!`;
    }

    if (preset === 'doflamingo') {
      if (isEmergency) return `🚨 FUFFUFFUFFU! An emergency incident?! The weak don't get to choose how they die! Let the Heavenly Yaksha handle this chaos!`;
      return `Purupurupuru... Fuffuffuffu!! Justice will prevail? Of course it will! Whoever wins becomes Justice! State your business, caller!`;
    }

    if (preset === 'vegapunk') {
      return `Purupurupuru... Greetings! This is the SSG Video Transponder Mushi engineered by Dr. Vegapunk! Audio & video feeds synced!`;
    }

    if (preset === 'luffy') {
      return `Purupurupuru! Shishishi!! Hey! I'm Monkey D. Luffy, the man who's gonna be King of the Pirates! Got any meat?!`;
    }

    if (preset === 'law') {
      return `Purupurupuru... This is Trafalgar Law. Don't waste my time unless you have intel on Doflamingo or the Yonko. ROOM!!`;
    }

    if (preset === 'crocodile') {
      return `Purupurupuru... Kuhahaha! You're speaking with Sir Crocodile of the Cross Guild. State your offer before I hang up.`;
    }

    return `Purupurupuru! ${this.config.name} receiving signal on ${this.config.region.toUpperCase()} frequency! State your business, traveler!`;
  }
}
