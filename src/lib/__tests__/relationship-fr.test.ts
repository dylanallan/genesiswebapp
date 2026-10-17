import { describe, expect, it } from 'vitest';
import { describeRelationshipFr, frNoun } from '../relationship-fr';
import type { Relationship } from '../relationship';

const rel = (label: string, gender: string | null = null, kind: Relationship['kind'] = 'blood'): Relationship =>
  ({ label, path: [], sharedAncestors: [], dnaPercent: null, kind, gender });

describe('relationships in French', () => {
  it('names blood relatives with the right form', () => {
    expect(frNoun('great-grandmother').text).toBe('arrière-grand-mère');
    expect(frNoun('2x great-grandfather').text).toBe('arrière-arrière-grand-père');
    expect(frNoun('granddaughter').text).toBe('petite-fille');
    expect(frNoun('great-aunt').text).toBe('grand-tante');
    expect(frNoun('2x great-uncle').text).toBe('arrière-grand-oncle');
    expect(frNoun('great-niece').text).toBe('petite-nièce');
    expect(frNoun('half-brother').text).toBe('demi-frère');
    expect(frNoun('first cousin', 'female').text).toBe('cousine germaine');
    expect(frNoun('second cousin once removed').text).toBe('cousin issu de germain, à une génération d’écart');
    expect(frNoun('third cousin twice removed').text).toBe('cousin au 3e degré, à 2 générations d’écart');
    expect(frNoun('aunt by marriage').text).toBe('tante par alliance');
  });

  it('writes the whole sentence', () => {
    expect(describeRelationshipFr('Rosa Diaz', rel('great-grandmother'))).toBe('Rosa est votre arrière-grand-mère.');
    expect(describeRelationshipFr('Rosa Diaz', rel('mother'), 'Juan Diaz')).toBe('Rosa est la mère de Juan.');
    expect(describeRelationshipFr('Ana', rel('uncle'), 'Juan')).toBe('Ana est l’oncle de Juan.');
    expect(describeRelationshipFr('Paul', rel('husband of your first cousin', null, 'in-law'))).toBe('Paul est le mari de votre cousin germain.');
    expect(describeRelationshipFr('Eva', rel("your wife's grandmother", 'female', 'in-law'), 'Juan')).toBe('Eva est la grand-mère de l’épouse de Juan.');
    expect(describeRelationshipFr('Tom', rel("husband of your wife's sister", 'male', 'in-law'))).toBe('Tom est le mari de la sœur de votre épouse.');
    expect(describeRelationshipFr('Rosa', null)).toBe('Nous n’avons pas encore trouvé de lien entre vous et Rosa dans l’arbre.');
    expect(describeRelationshipFr('Rosa', rel('you', null, 'self'))).toBe('C’est la même personne.');
  });
});
