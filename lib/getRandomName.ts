const possibleNames = [
    'Aiden',
    'Alexander',
    'Andrew',
    'Anthony',
    'Asher',
    'Benjamin',
    'Caleb',
    'Carter',
    'Charles',
    'Christian',
    'Christopher',
    'Daniel',
    'David',
    'Dylan',
    'Elijah',
    'Ethan',
    'Gabriel',
    'Henry',
    'Isaac',
    'Jack',
    'Jackson',
    'Jacob',
    'James',
    'John',
    'Joseph',
    'Joshua',
    'Liam',
    'Lincoln',
    'Logan',
    'Lucas',
    'Luke',
    'Mason',
    'Matthew',
    'Michael',
    'Nathan',
    'Nicholas',
    'Noah',
    'Oliver',
    'Owen',
    'Samuel',
    'Sebastian',
    'Theodore',
    'Thomas',
    'William',
    'Wyatt',
    'Xavier',
    'Zachary',
]

let usedNames: string[] = []

export function getRandomName(blackList: string[] = []) {
    if (usedNames.length === possibleNames.length) {
        usedNames = []
    }
    let name = ''
    for (let i = 0; i < 10000; i++) {
        name = possibleNames[Math.floor(Math.random() * possibleNames.length)]
        if (blackList.includes(name)) {
            continue
        }
        if (!usedNames.includes(name)) {
            usedNames.push(name)
            break
        }
    }
    return name
}
