import Team from '../Team';

test(
  'In an object of the Team class, only objects of the Character class can be added, no error occurs if the object being added is not a Character',
  () => {
    const team = new Team();
    team.add({});
    expect(team.characters.length).toBe(0);
  },
);
