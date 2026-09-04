export const MODES = { TABLE:'table', TWO_BY_ONE:'2x1', THREE_BY_ONE:'3x1', TWO_BY_TWO:'2x2', THREE_BY_TWO:'3x2' } as const;
export type Mode = typeof MODES[keyof typeof MODES];
export type Question = { a:number;b:number;answer:number;options:number[];key:string };
export const MODE_INFO: Record<Mode,{name:string;icon:string;note:string}> = {
  table:{name:'Multiplication Tables',icon:'🌱',note:'Facts from 1 to 10'},
  '2x1':{name:'2-Digit × 1-Digit',icon:'🌸',note:'A gentle next step'},
  '3x1':{name:'3-Digit × 1-Digit',icon:'⭐',note:'Bigger numbers, same magic'},
  '2x2':{name:'2-Digit × 2-Digit',icon:'🦄',note:'Practice partial products'},
  '3x2':{name:'3-Digit × 2-Digit',icon:'👑',note:'A royal challenge'},
};
export const WORLDS = ['Cherry Blossom Garden','Rainbow Valley','Unicorn Kingdom','Fairy Garden','Mermaid Lagoon','Moonlight Forest','Candy Kingdom','Panda Forest','Cloud Kingdom','Enchanted Castle','Sunflower Meadow','Snowflake Village','Cupcake Town','Starlight Space','Butterfly Garden','Crystal Cave','Bunny Village','Star Kingdom','Mushroom Forest','Seashell Beach','Carousel Kingdom','Tropical Island','Strawberry Village','Heart Kingdom','Ribbon Garden','Tulip Valley','Galaxy Garden','Lotus Lake'];
export const TREASURES = [
  {icon:'🌟',name:'Little Star',rarity:'Common'}, {icon:'🌸',name:'Pink Blossom',rarity:'Common'}, {icon:'🍓',name:'Strawberry',rarity:'Common'}, {icon:'🎀',name:'Pretty Bow',rarity:'Common'},
  {icon:'💎',name:'Magic Gem',rarity:'Rare'}, {icon:'🦄',name:'Unicorn Friend',rarity:'Rare'}, {icon:'👑',name:'Princess Crown',rarity:'Rare'}, {icon:'🐰',name:'Royal Bunny',rarity:'Rare'},
  {icon:'🏰',name:'Enchanted Castle',rarity:'Super Rare'}, {icon:'🐉',name:'Rainbow Dragon',rarity:'Super Rare'}, {icon:'⭐',name:'Legendary Star',rarity:'Super Rare'},
  {icon:'🦄🌈',name:'Celestial Unicorn',rarity:'Legendary'}, {icon:'👑✨',name:'Starlight Crown',rarity:'Legendary'},
] as const;
export const rand=(min:number,max:number)=>Math.floor(Math.random()*(max-min+1))+min;
const shuffle=<T,>(items:T[])=>items.map(v=>({v,n:Math.random()})).sort((a,b)=>a.n-b.n).map(x=>x.v);
export function makeQuestion(mode:Mode,tables:number[],avoid=''):Question{
  let a=2,b=2;
  for(let i=0;i<8;i++){
    if(mode==='table'){a=tables[rand(0,tables.length-1)]??2;b=rand(1,10)}
    else if(mode==='2x1'){a=rand(10,99);b=rand(2,9)} else if(mode==='3x1'){a=rand(100,999);b=rand(2,9)} else if(mode==='2x2'){a=rand(10,99);b=rand(10,99)} else {a=rand(100,999);b=rand(10,99)}
    if(`${Math.min(a,b)}x${Math.max(a,b)}`!==avoid) break;
  }
  const answer=a*b; const near=[answer+a,answer-a,answer+b,answer-b,answer+10,answer-10,Math.max(1,answer+rand(-9,9)),Math.max(1,(a*(b%10))+(Math.floor(b/10)*a))].filter(n=>n>0&&n!==answer);
  return {a,b,answer,options:shuffle([answer,...Array.from(new Set(near)).slice(0,3)]),key:`${Math.min(a,b)}x${Math.max(a,b)}`};
}
export function hintFor(q:Question,attempt:number){if(q.b<10)return attempt<3?`Multiply ${q.a} by ${q.b} one place at a time. 🌸`:`Check each carry before you add.`;const ones=q.b%10,tens=Math.floor(q.b/10);return attempt===2?`Start by multiplying ${q.a} × ${ones}. 🌸`:attempt===3?`Now remember that the ${tens} in ${q.b} means ${tens*10}.`:`Find ${q.a} × ${tens*10}, then add your two partial answers.`}
export function pickTreasure(){const n=Math.random()*100;const rarity=n<2?'Legendary':n<12?'Super Rare':n<38?'Rare':'Common';const pool=TREASURES.filter(t=>t.rarity===rarity);return pool[rand(0,pool.length-1)]}
