export interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

// Remove initial imageUrl values to ensure Together API is used for generation
export const popularCharacters: Character[] = [
  {
    id: "harry-potter",
    name: "Harry Potter",
    description: "The Boy Who Lived, from Hogwarts School of Witchcraft and Wizardry",
    imageUrl: undefined
  },
  {
    id: "sherlock-holmes",
    name: "Sherlock Holmes",
    description: "The world's greatest detective from 221B Baker Street",
    imageUrl: undefined
  },
  {
    id: "chota-bheem",
    name: "Chota Bheem",
    description: "The brave and strong boy from Dholakpur",
    imageUrl: undefined
  },
  {
    id: "einstein",
    name: "Albert Einstein",
    description: "The theoretical physicist who developed the theory of relativity",
    imageUrl: undefined
  }
];

export const educationalCharacters: Character[] = [
  {
    id: "marie-curie",
    name: "Marie Curie",
    description: "Pioneer in the field of radioactivity and two-time Nobel Prize winner",
    imageUrl: undefined
  },
  {
    id: "aryabhatta",
    name: "Aryabhatta",
    description: "Ancient Indian mathematician and astronomer",
    imageUrl: undefined
  },
  {
    id: "isaac-newton",
    name: "Isaac Newton",
    description: "Physicist, mathematician and astronomer known for the laws of motion",
    imageUrl: undefined
  },
  {
    id: "pythagoras",
    name: "Pythagoras",
    description: "Ancient Greek philosopher and mathematician known for the Pythagorean theorem",
    imageUrl: undefined
  }
];
