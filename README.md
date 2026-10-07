# Welcome to the Red Squirrel Harnness Framework !

<i>This framework is a DevX quality harness observer for claude code</i>

## Getting Started

🐿️ - Install the app

```bash
nvm use 22
npm i -g red-squirrel
```

🐿️🐿️ - Start then red squirrel

```bash
squirrel --watch
```

Then the app should run on your browser at [http://localhost:4000]

```
Waking up the red squirrel...
        /\/\             _______
       /    \           /       \
      / o  o \         /   ___   \
     /   <>   \        |  /   \  |
    /  __/\__  \       |  \___/  |
   /  /      \  \      \        /
  (__|        |__)      \      /
   /  \    /  \_________/     /
  /    \__/    \            /
  \____________/___________/
    /__/  \__\

```

## Run from source code

```
nvm use 22
npm run dev
```

## Harnesses details

### Antidilution harness

x = number of lines in CLAUDE.md, y = V score in %.

         ⎧ 100                  if x ≤ 100

f(x) = ⎨ (400 − x) / 3 if 100 < x < 400
⎩ 0 if x ≥ 400

def f(x: int) -> float:
return max(0.0, min(100.0, (400 - x) / 3))

## Troubleshooting

Pack, install and run without npmjs.org

```
nvm use 22
npm pack
npm i -g red-squirrel-0.2.0.tgz
squirrel --watch
```

### API

#### Harnesses API

##### create

```
curl -X POST http://localhost:4115/api/harnesses \
  -H 'content-type: application/json' \
  -d '{"name":"Anti-dilution","description":"The anti-dilution harness is to sum and relate dilution risks on different project levels (enterprise / user / project / sub-project). It is also recognizing the rules and adding them to the dilution potential"}'
```

##### update

```
curl -X PUT http://localhost:4115/api/harnesses/toto \
  -H 'content-type: application/json' \
  -d '{"description":"new desc"}'
```

##### delete

```
curl -X DELETE http://localhost:4115/api/harnesses/toto
```
