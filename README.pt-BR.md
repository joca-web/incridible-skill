<div align="center">

# Awwwards Skill

**Uma skill para agentes de IA criarem sites nível Awwwards, e os modelos 3D que vão neles.**
Direção de arte, motion com GSAP + ScrollTrigger + Lenis, biblioteca de componentes testada, transições entre páginas, modelagem 3D em código com exportação .glb, palcos 3D com efeitos de scroll e cursor, image-to-code e QA em navegador real.

![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Agent Skill](https://img.shields.io/badge/agent%20skill-SKILL.md-black)
![Plugin do Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-d97757)
![Three.js r187](https://img.shields.io/badge/three.js-r187-049ef4)
![Node 22+](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)
![Versão](https://img.shields.io/badge/vers%C3%A3o-3.0.0-orange)

[3D](#modelos-3d-feitos-pela-ia) · [Instalar](#instalação) · [Uso](#uso) · [Componentes](#componentes) · [Ferramentas](#ferramentas-de-verificação) · [Contribuir](CONTRIBUTING.md) · [English](README.md)

</div>

---

A maioria dos sites feitos por IA parece gerada porque toda decisão foi o padrão: hero centralizado, três cards com ícone, gradiente roxo, fade-up em tudo. Esta skill dá ao agente um processo repetível para fazer o que estúdios premiados fazem: partir de uma ideia que pertence ao assunto, levá-la por tipografia, cor, imagem, movimento e 3D, e provar o resultado num navegador real.

Ela é organizada pelos pesos do Awwwards (Design 40%, Usabilidade 30%, Criatividade 20%, Conteúdo 10%) e pelos critérios do Developer Award.

> Antes chamada **incridible-skill**. As versões 1 e 2 ficam arquivadas, sem mudanças, em [`versions/`](versions).

## Modelos 3D feitos pela IA

Novidade da 3.0. O agente agora constrói objetos 3D sozinho, olha o resultado, corrige e coloca na página:

- **Modelagem em código** com o [`assets/three/kit.js`](skills/awwwards-skill/assets/three/kit.js): perfis torneados (garrafas, copos, conchas de fone), tubos (arcos de fone, cabos), caixas arredondadas (cartas, celulares), logos extrudados de SVG, rótulos curvos, escultura de vértices, texturas pintadas por código (pinturas de capacete, rótulos, arte de cartas, fibra de carbono, meio-tom) e materiais PBR (ouro, cromo, vidro, líquido, pintura com verniz, plástico, borracha, tecido, carbono).
- **Ver o que construiu**: o [`scripts/model3d.mjs`](skills/awwwards-skill/scripts/model3d.mjs) renderiza o modelo num Chrome real por seis ângulos, lista triângulos, materiais e problemas, e exporta um **.glb** (abre em qualquer motor 3D e no Blender), uma imagem com fundo transparente e um giro de 360°.
- **Colocar na página**: o [`assets/three/stage.js`](skills/awwwards-skill/assets/three/stage.js) faz o modelo girar com o scroll, inclinar com o cursor, seguir uma trajetória em seções fixas, entrar animado e o efeito do landonorris.com: o modelo aparece só dentro de um círculo que segue o cursor, sobre uma silhueta translúcida.
- **Quatro modelos testados e com parâmetros**: capacete de corrida (cor, grafismo, número, viseira), garrafa de destilado (líquido, vidro, rótulo), fone de ouvido e carta colecionável com moldura dourada.
- **Um starter 3D** com o hero do capacete revelado pelo cursor, cartas 3D girando numa seção fixa sobre marcas de jardas, produtos em 3D, texto em meio-tom e cortes diagonais (técnicas estudadas em landonorris.com, jjettas.com e santionispirits.com; nenhum material copiado).
- **Limites honestos** no [`references/10-3d-modeling.md`](skills/awwwards-skill/references/10-3d-modeling.md): código é ótimo para objetos rígidos e simétricos; para um tênis real específico ou um rosto, use o arquivo do cliente ou um gerador de 3D por IA, e depois inspecione e posicione com as mesmas ferramentas.

## O que mais vem dentro

| Área | Incluído |
|---|---|
| **Fluxo** | Inventário, direção, frase da ideia, fundações, build em camadas (estático, motion, profundidade e 3D, acabamento), gate, relatório |
| **Direção de arte** | 12 direções de composição, checklist anti-genérico, teste da ideia, regras de texto |
| **Motion** | 15 receitas e 24 componentes prontos: revelação de texto, embaralhamento, rastro de imagens, cards empilhados, filtros com Flip, slider arrastável, SVG desenhado, distorção WebGL, fundo em shader, fontes variáveis, imagem que expande, transições entre páginas e mais |
| **Starters** | `monument` (página única), `editorial` (três páginas com cortina), `product-3d` (3D ao vivo) |
| **Image to code** | Sonda, tiles, régua, paleta, recorte e um loop de diff com metas mensuráveis |
| **Gates de qualidade** | Inspetor em navegador real com scroll por roda e toque, tempo de quadro, passadas de hover e foco, detecção de texto preso em máscara, reduced motion e CDN bloqueado |

## Instalação

Escolha uma forma.

### Plugin do Claude Code (recomendado)

```text
/plugin marketplace add joca-web/incridible-skill
/plugin install awwwards-skill@awwwards-skill
```

Pelo terminal: `claude plugin marketplace add joca-web/incridible-skill` e depois `claude plugin install awwwards-skill@awwwards-skill`.

Já tinha a incridible-skill? Remova antes (`/plugin uninstall incridible-skill@incridible-skill` e `/plugin marketplace remove incridible-skill`) e depois adicione e instale como acima. As duas responderiam aos mesmos pedidos.

### Skills CLI (qualquer agente que leia `SKILL.md`)

```bash
npx skills add joca-web/incridible-skill
```

Escolha `awwwards-skill`.

### Scripts de instalação

Windows (PowerShell):

```powershell
git clone https://github.com/joca-web/incridible-skill.git
cd incridible-skill
.\install.ps1             # instala em $HOME\.claude\skills
.\install.ps1 -Project    # instala em .\.claude\skills do projeto atual
```

macOS e Linux:

```bash
git clone https://github.com/joca-web/incridible-skill.git
cd incridible-skill
./install.sh              # instala em ~/.claude/skills
./install.sh --project    # instala em ./.claude/skills do projeto atual
```

Rode de novo para atualizar; `-Uninstall` / `--uninstall` remove. O instalador avisa se ainda houver uma cópia antiga da incridible-skill.

### Cópia manual

Copie `skills/awwwards-skill` para `~/.claude/skills/` (todos os projetos) ou `<projeto>/.claude/skills/`.

### App do Claude (web e desktop)

Baixe [`dist/awwwards-skill.plugin`](dist/awwwards-skill.plugin) e abra no app do Claude para instalar como plugin, ou [`dist/awwwards-skill.skill`](dist/awwwards-skill.skill) para adicionar como skill. Use um dos dois, não os dois, e remova a incridible-skill antiga.

## Uso

```text
Faça um site para um piloto fictício com um capacete 3D no hero que aparece embaixo do cursor, como no
landonorris.com. Use a awwwards-skill: modele o capacete, me mostre as vistas e depois monte e verifique a página.
```

```text
Faça um modelo 3D de uma garrafa de gin com rótulo "Serra Alta", exporte em .glb e coloque num site
com a garrafa girando conforme o scroll.
```

```text
Aqui está nosso tênis em .glb (tenis.glb). Inspecione, comprima se estiver pesado e monte uma página de
lançamento em que ele gira numa seção fixa.
```

Quando a inspiração é um site real, a skill estuda técnica e estrutura. Ela não copia fotos, logos, textos, modelos 3D nem a marca do site.

## Componentes

Copie `assets/components/` para o site e depois:

```html
<script type="module">
  import { boot } from './components/index.js';
  boot();   // scroll suave, transições e todos os componentes data-* da página
</script>
```

Os palcos 3D têm entrada própria (precisam do import map do Three.js): `import { initStages } from './three/stage.js'`. Catálogo completo em [`references/09-components.md`](skills/awwwards-skill/references/09-components.md).

## Ferramentas de verificação

Ficam em `skills/awwwards-skill/scripts/`.

| Script | Precisa de | Faz |
|---|---|---|
| `model3d.mjs` | Node 22+, Chrome | Constrói um modelo 3D ou inspeciona um .glb: seis vistas, estatísticas, problemas, exportação .glb, imagem de reserva e giro |
| `shoot.mjs` | Node 22+, Chrome, Chromium ou Edge | Checagens estáticas, screenshots por etapa, scroll real por roda ou toque com tempo de quadro e quadros gravados, passadas de hover e teclado, reduced motion |
| `filmstrip.py` | Python 3, Pillow | Folha de contato ou GIF do scroll ou do giro de um modelo |
| `vendor.mjs` | Node 18+ | Baixa GSAP, Lenis e Three.js para testar com as bibliotecas reais sem internet |
| `compare.py` | Python 3, Pillow, numpy | Diff estrutural entre referência e screenshot |
| `img_probe.py` | Python 3, Pillow | Info da imagem, tiles, régua, paleta com contraste, recortes |

```powershell
node skills\awwwards-skill\scripts\model3d.mjs skills\awwwards-skill\assets\three\models\helmet.js --param number=44
python -m http.server 4173 --directory meu-site
node skills\awwwards-skill\scripts\shoot.mjs http://localhost:4173 --out .awwwards\after
```

(Suba o servidor num terminal e rode o `shoot.mjs` em outro.) No macOS e Linux use `python3`.

## Estrutura do repositório

```text
.claude-plugin/              manifests do plugin e do marketplace
skills/awwwards-skill/
  SKILL.md                   fluxo, regras, roteamento
  references/                10 guias (09 componentes, 10 modelagem 3D)
  assets/three/              kit.js, stage.js, stage.css, models/ (capacete, garrafa, fone, carta)
  assets/components/         biblioteca de componentes
  assets/starters/           monument, editorial, product-3d
  scripts/                   model3d.mjs, shoot.mjs, filmstrip.py, vendor.mjs, compare.py, img_probe.py
dist/                        awwwards-skill.skill e awwwards-skill.plugin
versions/                    v1 e v2 (incridible-skill), arquivadas sem mudanças
tools/validate.py            verificações do repositório (também rodam no CI)
install.sh, install.ps1      instaladores
```

## Escopo e limites

- Tudo rodou com GSAP 3.15.1, Lenis 1.3.27 e Three.js r187 reais em Chrome headless. Lá o WebGL é renderizado por software: os tempos de quadro servem para comparar, e páginas 3D pesadas rolam devagar no teste. Confira o starter 3D num celular de verdade.
- Os modelos feitos em código são estilizados. Funcionam muito bem para capacetes, garrafas, cartas, fones, embalagens e logos; não para rostos, animais ou um tênis de marca específico.
- O download do `vendor.mjs` não pôde ser testado no ambiente de criação (sem rede); a extração de pacotes reais foi testada. O `install.ps1` não foi executado (sem PowerShell).
- O repositório mantém o endereço antigo (`joca-web/incridible-skill`). Dá para renomeá-lo no GitHub para `awwwards-skill`; o GitHub redireciona o endereço antigo.

## Roadmap

- [ ] Análises de `why.zero.university` e `auge-xp.com`
- [ ] Mais modelos: silhueta de tênis a partir de imagem, lata, troféu, celular
- [ ] Carregamento de HDRI e compressão Draco/Meshopt dentro do model3d.mjs
- [ ] Versão do palco para React Three Fiber

## Créditos e aviso

- Ideias de processo informadas pelo [Taste Skill](https://www.tasteskill.dev/).
- Técnicas estudadas em landonorris.com (OFF+BRAND), jjettas.com e santionispirits.com (Active Theory). Nenhum material, modelo ou texto deles está incluído. Este projeto não é afiliado a nenhum deles, ao Awwwards, à McLaren nem à NFL.
- GSAP (GreenSock, gratuito pela licença padrão), Lenis (MIT) e Three.js (MIT) pertencem aos seus autores e são carregados de CDNs, não incluídos.

## Licença

[MIT](LICENSE)
