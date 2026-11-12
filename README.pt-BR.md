<div align="center">

# incridible-skill

**Uma skill para agentes de IA criarem sites nível Awwwards.**
Direção de arte, motion com GSAP + ScrollTrigger + Lenis, hero WebGL com profundidade, image-to-code e QA em navegador real.

![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Agent Skill](https://img.shields.io/badge/agent%20skill-SKILL.md-black)
![Plugin do Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-d97757)
![Node 22+](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)
![Versão](https://img.shields.io/badge/vers%C3%A3o-1.0.0-orange)

[Instalar](#instalação) · [Uso](#uso) · [Como funciona](#como-funciona) · [Ferramentas](#ferramentas-de-verificação) · [Contribuir](CONTRIBUTING.md) · [English](README.md)

</div>

---

A maioria dos sites feitos por IA parece gerada porque toda decisão foi o padrão: hero centralizado, três cards com ícone, gradiente roxo, fade-up em tudo. Esta skill dá ao agente um processo repetível para fazer o que estúdios premiados fazem: partir de uma ideia que pertence ao assunto, levá-la por tipografia, cor, imagem e movimento, e provar o resultado num navegador real.

Ela é organizada pelos pesos de avaliação do Awwwards (Design 40%, Usabilidade 30%, Criatividade 20%, Conteúdo 10%) e pelos critérios do Developer Award (semântica, animações, acessibilidade, performance, responsividade, marcação).

## O que vem dentro

| Área | Incluído |
|---|---|
| **Fluxo** | Inventário, direção, frase da ideia, fundações, build em camadas (estático, motion, profundidade, acabamento), gate, relatório |
| **Direção de arte** | 12 direções de composição, checklist anti-genérico, teste da ideia, regras de texto |
| **Motion** | 15 receitas: preloader, reveal de linhas, cenas fixas, scroll horizontal, reveals com clip-path, capítulos de cor, marquee, botão magnético, cursor customizado, máscaras no hover, transições de página |
| **Profundidade** | Hero WebGL com mapa de profundidade sem dependências, texto atrás do sujeito, blobs que seguem o cursor, notas de Three.js, vídeo e Rive |
| **Image to code** | Sonda, tiles, régua, paleta, recorte e um loop de diff com metas mensuráveis |
| **Gates de qualidade** | Inspetor em navegador real, passes de reduced motion e CDN bloqueado, orçamentos de acessibilidade e performance |
| **Site starter** | Base funcional com preloader, Lenis + GSAP, reveals, cenas fixas e horizontais, marquee e cursor |

## Instalação

Escolha uma. Todos os métodos instalam a mesma skill.

### Plugin do Claude Code (recomendado)

Dentro do Claude Code:

```text
/plugin marketplace add jocaaurudo67-design/incridible-skill
/plugin install incridible-skill@incridible-skill
```

Ou pelo terminal:

```bash
claude plugin marketplace add jocaaurudo67-design/incridible-skill
claude plugin install incridible-skill@incridible-skill
```

Skills de plugin têm namespace, então você também pode chamar com `/incridible-skill:incridible-skill`.

### Skills CLI (qualquer agente que leia `SKILL.md`)

```bash
npx skills add jocaaurudo67-design/incridible-skill
```

### Scripts de instalação

Windows (PowerShell):

```powershell
git clone https://github.com/jocaaurudo67-design/incridible-skill.git
cd incridible-skill
.\install.ps1             # instala em $HOME\.claude\skills
.\install.ps1 -Project    # instala em .\.claude\skills do projeto atual
```

macOS e Linux:

```bash
git clone https://github.com/jocaaurudo67-design/incridible-skill.git
cd incridible-skill
./install.sh              # instala em ~/.claude/skills
./install.sh --project    # instala em ./.claude/skills do projeto atual
```

Para remover: `.\install.ps1 -Uninstall` ou `./install.sh --uninstall`.

### Cópia manual

Copie a pasta `skills/incridible-skill` para `~/.claude/skills/` (vale para todos os projetos) ou para `<projeto>/.claude/skills/` (só um projeto). No Windows, `~` é a sua pasta de usuário (`C:\Users\seu-nome`).

### App do Claude (web e desktop)

Baixe [`dist/incridible-skill.skill`](dist/incridible-skill.skill) e adicione pela seção de Skills nas configurações do Claude. O nome dos menus varia conforme o plano.

## Uso

A skill é acionada sozinha quando você pede sites premium, animados ou nível Awwwards. Você também pode citá-la pelo nome.

```text
Faça um site de uma página para uma torrefação de café especial. Use a incridible-skill:
direção "dark room", cenas de scroll com GSAP, uma interação marcante, e verifique no navegador.
```

```text
Aqui está um print do design (ref.png). Recrie com fidelidade de pixel e depois adicione o
movimento que ele sugere. Use a incridible-skill e me mostre os números do diff.
```

```text
Redesenhe esta landing page para parar de parecer gerada por IA. Mantenha a stack e o conteúdo.
```

Quando a inspiração é um site real, a skill estuda técnica e estrutura. Ela não copia fotos, logos, textos nem a marca do site.

## Como funciona

1. **Inventário e briefing.** De oito a doze detalhes que só esse cliente tem, escritos como afirmações com prova.
2. **Direção.** Uma direção de composição, paleta, par tipográfico e caráter de movimento, fixados como tokens.
3. **Ideia e momento marcante.** Uma frase que falha para o concorrente mais próximo e uma coisa que o visitante pode fazer.
4. **Fundações.** Escalas fluidas de tipo e espaço, grid, plano responsivo (mobile como composição própria).
5. **Build em camadas.** Estático primeiro, depois motion, profundidade e acabamento.
6. **Image to code** quando existe uma referência visual.
7. **Gate.** Inspeção em navegador real em 1440, 768 e 390 px, e um loop de olhar e corrigir pontuado com os pesos do Awwwards.
8. **Relatório.** Notas, números, o que é placeholder, licenças e o que não foi verificado.

Os detalhes completos estão em [`skills/incridible-skill/SKILL.md`](skills/incridible-skill/SKILL.md).

## Ferramentas de verificação

Ficam em `skills/incridible-skill/scripts/`. Não exigem instalar nada além do listado.

| Script | Precisa de | Faz |
|---|---|---|
| `shoot.mjs` | Node 22+, Chrome, Chromium ou Edge | Abre a página em três larguras, rola, salva quadros e relata elementos em movimento, conteúdo preso invisível, falhas de reduced motion, erros de console, imagens quebradas, overflow, títulos, alt, áreas de toque, LCP, CLS e peso |
| `compare.py` | Python 3, Pillow, numpy | Diff estrutural entre imagem de referência e screenshot, com mapa de calor e as piores regiões |
| `img_probe.py` | Python 3, Pillow | Info da imagem, tiles, régua de pixels, paleta com contraste, recortes |

```powershell
python -m http.server 4173 --directory meu-site
node skills\incridible-skill\scripts\shoot.mjs http://localhost:4173 --out .incridible\after
```

(Abra o servidor em um terminal e rode o `shoot.mjs` em outro.) No macOS e Linux use `python3`. O `shoot.mjs` termina com código 1 quando encontra qualquer FAIL, então pode rodar em CI.

## Estrutura do repositório

```text
.claude-plugin/            manifests de plugin e marketplace
skills/incridible-skill/
  SKILL.md                 fluxo, regras, roteamento
  references/              8 guias de referência
  assets/starter/          site base funcional
  assets/webgl/            depth-hero.js
  scripts/                 shoot.mjs, compare.py, img_probe.py
dist/incridible-skill.skill   skill empacotada
tools/validate.py          verificações do repositório (também rodam no CI)
install.sh, install.ps1    instaladores
```

## Escopo e limites

- O inspetor, o hero WebGL e os scripts de imagem foram executados em Chrome headless. A camada de motion com GSAP, ScrollTrigger e Lenis foi testada só com bibliotecas simuladas, porque o ambiente de criação não tinha rede. Abra o starter uma vez num navegador normal para ver as animações.
- O WebGL foi verificado com renderização por software. A fluidez numa GPU real não foi medida.
- As referências analisadas até agora são landonorris.com e tasteskill.dev. `why.zero.university` e `auge-xp.com` não abriram quando a skill foi escrita e ainda não têm notas (veja o [Roadmap](#roadmap)).
- Uma skill eleva o piso e dá um processo ao agente. Prêmios ainda dependem da ideia, do conteúdo e do gosto de quem dirige o trabalho.

## Roadmap

- [ ] Análises de `why.zero.university` e `auge-xp.com`
- [ ] Starter opcional com cena Three.js
- [ ] Mais direções no starter (capítulos de cor, pôster fixo)
- [ ] Benchmarks contra um baseline sem a skill, com comparação cega

## Contribuindo

Issues e pull requests são bem-vindos. Leia o [CONTRIBUTING.md](CONTRIBUTING.md) antes e rode `python3 tools/validate.py` antes de abrir um PR.

## Créditos e aviso

- Ideias de processo (inventário, frase da ideia, inspetor em navegador real, loop de olhar e corrigir) foram informadas pelo [Taste Skill](https://www.tasteskill.dev/).
- As notas de craft sobre landonorris.com vêm do código público da página e de matérias públicas (Awwwards, DesignRush, Codrops, Syntax). Este projeto não é afiliado a Lando Norris, McLaren, OFF+BRAND, Awwwards nem ao Taste Skill.
- GSAP, ScrollTrigger, Lenis, Three.js e Rive pertencem aos seus autores e não estão incluídos aqui.

## Licença

[MIT](LICENSE)
