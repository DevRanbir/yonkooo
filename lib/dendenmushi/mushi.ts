export type RegionTheme = 
  | 'east_blue'
  | 'marine'
  | 'pirate'
  | 'wano'
  | 'water_7'
  | 'royal'
  | 'cp0'
  | 'golden_buster';

export type ExpressionState = 
  | 'happy'
  | 'neutral'
  | 'suspicious'
  | 'surprised'
  | 'angry'
  | 'worried'
  | 'sleepy'
  | 'confident'
  | 'sad'
  | 'curious'
  | 'shock'
  | 'sinister'
  | 'serious';

export type MushiEmotionalState = 
  | 'idle'
  | 'calling'
  | 'connecting'
  | 'hq_answering'
  | 'listening'
  | 'confused'
  | 'emergency_detected'
  | 'critical'
  | 'speaking';

export type PersonalityType = 
  | 'cheerful'
  | 'serious'
  | 'nervous'
  | 'curious'
  | 'sarcastic'
  | 'formal'
  | 'brave'
  | 'sleepy'
  | 'dramatic'
  | 'sinister'
  | 'emperor'
  | 'goofy';

export type ModelMode = 'procedural' | 'glb_law' | 'glb_law_hd';

export type EyeShape = 'round' | 'oval' | 'narrow' | 'large' | 'droopy' | 'wide' | 'angry' | 'sleepy' | 'doflamingo_shades' | 'hawk_eyes';
export type EyebrowStyle = 'thick' | 'angled' | 'flat' | 'curved' | 'bushy' | 'none' | 'spiral_sanji';
export type MouthStyle = 'wide' | 'small' | 'oval' | 'smile' | 'frown' | 'shock' | 'toothy_grin' | 'duck_bill' | 'big_lipstick' | 'cigar_mouth';
export type ShellShape = 'classic_spiral' | 'ridged_shell' | 'tall_spire' | 'smooth_dome' | 'armored_plates' | 'vegapunk_camera' | 'whitebeard_headset';
export type AccessoryType = 
  | 'none' 
  | 'marine_hat' 
  | 'pirate_patch' 
  | 'water7_goggles' 
  | 'wano_rope' 
  | 'royal_crown' 
  | 'cp0_glasses' 
  | 'headset'
  | 'straw_hat'
  | 'doflamingo_glasses'
  | 'law_spotted_hat'
  | 'whitebeard_mustache'
  | 'clown_nose'
  | 'vegapunk_lens'
  | 'croc_cigar'
  | 'smoker_cigars'
  | 'franky_hair'
  | 'pink_feather_boa';

export type CharacterPresetId = 
  | 'custom'
  | 'luffy'
  | 'whitebeard'
  | 'doflamingo'
  | 'law'
  | 'vegapunk'
  | 'ivankov'
  | 'crocodile'
  | 'smoker'
  | 'kizaru'
  | 'franky'
  | 'mihawk'
  | 'buggy'
  | 'marine_officer'
  | 'buster_call';

export type TriageLevel = 'code_green' | 'code_yellow' | 'code_red' | 'code_black';
export type RescueStatus = 'idle' | 'dispatching' | 'en_route' | 'arrived' | 'resolved';

export interface SosSession {
  sessionId: string;
  callerId: string;
  callerRole: string;
  status: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISPATCHED' | 'RESOLVED';
  createdAt: string;
  locationName: string;
  coordinates: string;
  incidentType: string;
  injuredCount: number;
  threatActive: boolean;
  severity: TriageLevel;
  channel: string;
  assignedFleetId?: string;
  recordingEvents: { timestamp: string; sender: string; text: string; eventType?: string }[];
}

export interface FleetUnit {
  id: string;
  name: string;
  type: 'rescue_ship' | 'medical_unit' | 'scout_unit' | 'battleship';
  status: 'AVAILABLE' | 'RESERVED' | 'EN_ROUTE' | 'RETURNING' | 'DEPLOYED';
  speedKnots: number;
  distanceKm: number;
  etaMinutes: number;
  currentCoords: string;
  assignedSessionId?: string;
}

export interface EmergencyRequest {
  id: string;
  caller: string;
  coordinates: string;
  locationName: string;
  incidentDescription: string;
  startTimeMs: number;
  waitSeconds: number;
  triageLevel: TriageLevel;
  rescueStatus: RescueStatus;
  progressPercent: number;
}

export interface FacialFeatures {
  eyeShape: EyeShape;
  eyeSize: number;
  eyeSpacing: number;
  eyeHeight: number;
  pupilStyle: 'large' | 'small' | 'ring' | 'cat' | 'hawk';
  pupilColor: string;
  eyebrowStyle: EyebrowStyle;
  eyebrowAngle: number;
  mouthStyle: MouthStyle;
  cheekStyle: 'none' | 'soft_blush' | 'spirals' | 'scars' | 'eye_scar' | 'star_tattoos';
  expression: ExpressionState;
  facialHair: 'none' | 'whitebeard_crescent' | 'mihawk_goatee' | 'thin_mustache' | 'kaido_mustache';
  glasses: 'none' | 'doflamingo_red' | 'cyborg_shades' | 'kizaru_tinted' | 'cp0_black';
  noseStyle: 'normal' | 'red_clown_nose' | 'pinocchio_long';
}

export interface BodyFeatures {
  bodyColor: string;
  skinPattern: 'plain' | 'spots' | 'stripes' | 'gradient';
  patternColor: string;
  bodyScale: number;
  bodyWidth: number;
  antennaLength: number;
  antennaCurve: number;
  neckAccessory: 'none' | 'pink_feather_coat' | 'marine_coat' | 'law_collar';
}

export interface ShellFeatures {
  shellShape: ShellShape;
  primaryColor: string;
  secondaryColor: string;
  dialColor: string;
  pattern: 'spiral' | 'swirl' | 'stripes' | 'camo' | 'solid' | 'flames' | 'heart_jolly';
  wearLevel: number;
  hasRotaryDial: boolean;
  receiverOnTop: boolean;
  hasKeypad: boolean;
  hasTopCameraLens: boolean;
}

export interface VoiceProfile {
  pitch: number;
  rate: number;
  pitchShiftName: string;
  laughSound?: string;
}

export interface MushiConfig {
  seed: string;
  name: string;
  presetId?: CharacterPresetId;
  modelMode: ModelMode;
  region: RegionTheme;
  personality: PersonalityType;
  face: FacialFeatures;
  body: BodyFeatures;
  shell: ShellFeatures;
  accessory: AccessoryType;
  voice: VoiceProfile;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mushi' | 'operator' | 'system';
  text: string;
  timestamp: string;
  expression?: ExpressionState;
  sosAlert?: boolean;
  mushiName?: string;
}

export interface CallState {
  status: 'idle' | 'ringing' | 'connected' | 'speaking_user' | 'speaking_mushi' | 'ended';
  isSosActive: boolean;
  callerIdentity?: string;
  incidentType?: string;
  location?: string;
}
