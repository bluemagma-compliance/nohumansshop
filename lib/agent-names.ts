// Fun, globally-unique agent handles: <Adjective><Animal>#<4 digits>
// e.g. GluttonousOtter#0421. Uniqueness is enforced by the DB; this just proposes.

const ADJECTIVES = [
  "Gluttonous", "Quantum", "Feral", "Spicy", "Velvet", "Rabid", "Cosmic",
  "Sneaky", "Turbo", "Mellow", "Cryptic", "Dapper", "Vexed", "Plucky",
  "Zealous", "Lurking", "Caffeinated", "Nocturnal", "Reckless", "Smug",
  "Wired", "Brisk", "Unhinged", "Pensive", "Greasy", "Stoic", "Jolly",
];

const ANIMALS = [
  "Otter", "Weasel", "Mongoose", "Falcon", "Lemur", "Badger", "Heron",
  "Marmot", "Wombat", "Narwhal", "Ferret", "Octopus", "Raven", "Gecko",
  "Bison", "Lynx", "Stoat", "Pangolin", "Axolotl", "Capybara", "Magpie",
  "Tapir", "Salamander", "Walrus", "Mantis", "Possum", "Hare",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomHandle(): string {
  const num = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${pick(ADJECTIVES)}${pick(ANIMALS)}#${num}`;
}
