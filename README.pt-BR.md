<div align="center">

# incridible-skill

**Uma skill para agentes de IA criarem sites nível Awwwards.**
Direção de arte, motion com GSAP + ScrollTrigger + Lenis, biblioteca de componentes testada, transições entre páginas, WebGL, image-to-code e QA em navegador real com scroll e mouse de verdade.

![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Agent Skill](https://img.shields.io/badge/agent%20skill-SKILL.md-black)
![Plugin do Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-d97757)
![Node 22+](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)
![Versão](https://img.shields.io/badge/vers%C3%A3o-2.0.0-orange)

[Novidades](#novidades-da-v2) · [Instalar](#instalação) · [Uso](#uso) · [Componentes](#componentes) · [Ferramentas](#ferramentas-de-verificação) · [Contribuir](CONTRIBUTING.md) · [English](README.md)

</div>

---

A maioria dos sites feitos por IA parece gerada porque toda decisão foi o padrão: hero centralizado, três cards com ícone, gradiente roxo, fade-up em tudo. Esta skill dá ao agente um processo repetível para fazer o que estúdios premiados fazem: partir de uma ideia que pertence ao assunto, levá-la por tipografia, cor, imagem e movimento, e provar o resultado num navegador real.

Ela é organizada pelos pesos de avaliação do Awwwards (Design 40%, Usabilidade 30%, Criatividade 20%, Conteúdo 10%) e pelos critérios do Developer Award (semântica, animações, acessibilidade, performance, responsividade, marcação).

## Novidades da v2

Mesmo nome, mesmo plugin, mesmos comandos: instalar ou atualizar a `incridible-skill` já entrega a versão 2. A versão 1 fica arquivada, sem mudanças, em [`versions/v1/`](versions/v1).

- **Animações testadas de verdade.** Todos os componentes e os dois starters rodaram com GSAP 3.15 e Lenis 1.3 reais no Chrome, com scroll por roda do mouse (desktop) e arraste de toque (celular). Isso achou e corrigiu bugs que o teste simulado da v1 não pegava, como um título principal que nunca aparecia e revelações que voltavam a se esconder. As lições estão escritas na skill.
- **Biblioteca de componentes: 24 efeitos em 16 módulos**, ativados por atributos `data-*` e com versão estática se algo falhar: revelação de texto por linha/palavra/letra, texto embaralhado, rastro de imagens no cursor, cards empilhados, filtros com Flip e vista em lista, slider arrastável com inércia, linha SVG se desenhando, distorção de imagem em WebGL, fundo em shader, fonte variável que reage ao cursor e ao scroll, imagem que expande, revelação em lote, parallax, cursor customizado, botão magnético, inclinação 3D, marquee, contadores, acordeão suave, barra de progresso e transições entre páginas.
- **Segundo starter:** um site editorial de três páginas com transição de cortina, ao lado do starter de página única da v1.
- **Inspetor mais inteligente:** passada de scroll com entrada real medindo a fluidez e gravando quadros, passada de hover, de foco por teclado, detecção de texto preso em máscara e `--vendor` para testar as bibliotecas reais sem internet.
- **Ferramentas novas:** `filmstrip.py` (folha de contato ou GIF do scroll) e `vendor.mjs` (baixa as bibliotecas para testes offline).

## Instalação

Escolha uma forma.

### Plugin do Claude Code (recomendado)

Dentro do Claude Code:

```text
/plugin marketplace add joca-web/incridible-skill
/plugin install incridible-skill@incridible-skill
```

Ou pelo terminal:

```bash
claude plugin marketplace add joca-web/incridible-skill
claude plugin install incridible-skill@incridible-skill
```

Já instalou antes? Atualize para a versão mais nova:

```bash
claude plugin marketplace update incridible-skill
claude plugin update incridible-skill@incridible-skill
```

### Skills CLI (qualquer agente que leia `SKILL.md`)

```bash
npx skills add joca-web/incridible-skill
```

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

Rode o instalador de novo para atualizar. Para remover: `-Uninstall` / `--uninstall`.

### Cópia manual

Copie a pasta `skills/incridible-skill` para `~/.claude/skills/` (todos os projetos) ou `<projeto>/.claude/skills/` (só um). No Windows, `~` é a sua pasta de usuário (`C:\Users\seu-nome`).

### App do Claude (web e desktop)

Baixe [`dist/incridible-skill.plugin`](dist/incridible-skill.plugin) e abra no app do Claude para instalar como plugin, ou baixe [`dist/incridible-skill.skill`](dist/incridible-skill.skill) e adicione pela seção de Skills nas configurações. Use um dos dois, não os dois. O nome dos menus varia conforme o plano.

## Uso

A skill é acionada sozinha quando você pede sites premium, animados ou nível Awwwards. Você também pode citá-la pelo nome.

```text
Faça um site de três páginas para um estúdio de design de interiores. Use a incridible-skill:
direção editorial, transições entre páginas, slider de projetos arrastável, e verifique cada página no navegador.
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
4. **Fundações.** Escalas fluidas de tipo e espaço, grid, mobile como composição própria.
5. **Build em camadas.** Estático primeiro, depois motion (componentes mais um momento marcante sob medida), profundidade e acabamento.
6. **Image to code** quando existe uma referência visual.
7. **Gate.** Inspeção em navegador real em 1440, 768 e 390 px com as bibliotecas reais e entrada real, uma folha de quadros para olhar, e um loop de olhar e corrigir pontuado com os pesos do Awwwards.
8. **Relatório.** Notas, números, placeholders, licenças e o que não foi verificado.

Detalhes completos: [`skills/incridible-skill/SKILL.md`](skills/incridible-skill/SKILL.md).

## Componentes

Copie `assets/components/` para o site e depois:

```html
<script type="module">
  import { boot } from './components/index.js';
  boot();   // scroll suave, transições e todos os componentes data-* da página
</script>
```

```html
<h2 data-reveal-split="lines">Linhas saindo de máscaras</h2>
<div data-stack><article data-stack-card>…</article><article data-stack-card>…</article></div>
<figure data-distort><img src="trabalho.webp" alt="…"></figure>
<section data-shader-bg="#0f0e0d, #ff4d1c, #f2efe9">…</section>
```

O catálogo completo, com a marcação de cada um e quais combinam com cada direção, está em [`references/09-components.md`](skills/incridible-skill/references/09-components.md).

## Ferramentas de verificação

Ficam em `skills/incridible-skill/scripts/`.

| Script | Precisa de | Faz |
|---|---|---|
| `shoot.mjs` | Node 22+, Chrome, Chromium ou Edge | Checagens estáticas, screenshots por etapa, scroll real por roda ou toque com tempo de quadro e quadros gravados, passadas de hover e teclado, reduced motion. Acha texto preso em máscara, páginas que não rolam, hovers sem resposta, foco invisível, avisos das bibliotecas, overflow, imagens quebradas, LCP, CLS e peso |
| `filmstrip.py` | Python 3, Pillow | Folha de contato (ou GIF) dos quadros gravados no scroll |
| `vendor.mjs` | Node 18+ | Baixa GSAP, Lenis e outras bibliotecas para o `shoot.mjs --vendor` testar sem internet |
| `compare.py` | Python 3, Pillow, numpy | Diff estrutural entre imagem de referência e screenshot, com mapa de calor |
| `img_probe.py` | Python 3, Pillow | Info da imagem, tiles, régua de pixels, paleta com contraste, recortes |

```powershell
python -m http.server 4173 --directory meu-site
node skills\incridible-skill\scripts\shoot.mjs http://localhost:4173 --out .incridible\after
python skills\incridible-skill\scripts\filmstrip.py .incridible\after --width 1440
```

(Abra o servidor em um terminal e rode os outros comandos em outro.) No macOS e Linux use `python3`. O `shoot.mjs` termina com código 1 quando encontra qualquer FAIL, então pode rodar em CI.

## Estrutura do repositório

```text
.claude-plugin/              manifests do plugin e do marketplace
skills/incridible-skill/
  SKILL.md                   fluxo, regras, roteamento
  references/                9 guias (o 09 é o catálogo de componentes)
  assets/components/         biblioteca de componentes
  assets/starters/           monument (página única) e editorial (três páginas)
  assets/webgl/              depth-hero.js
  scripts/                   shoot.mjs, filmstrip.py, vendor.mjs, compare.py, img_probe.py
dist/                        incridible-skill.skill e incridible-skill.plugin
versions/v1/                 versão 1, arquivada sem mudanças (fora do plugin)
tools/validate.py            verificações do repositório (também rodam no CI)
install.sh, install.ps1      instaladores
```

## Escopo e limites

- Todos os componentes da v2 e os dois starters rodaram com GSAP 3.15.1 e Lenis 1.3.27 reais (o Lenis compilado do código-fonte) em Chrome headless. Os tempos de quadro lá vêm de renderização por software: servem para comparar execuções, não para julgar a fluidez numa GPU real. Confira a home do starter editorial (shader e imagens WebGL) num aparelho de verdade.
- O `vendor.mjs` foi testado extraindo pacotes npm reais sem internet; o download em si não pôde ser exercitado no ambiente de criação, que não tinha rede.
- O `install.ps1` foi escrito para o PowerShell do Windows mas não foi executado (não havia PowerShell no ambiente); o `install.sh` e a instalação pelo plugin foram testados.
- As fontes estavam bloqueadas nos testes, então os layouts foram checados com fontes reserva; o título do starter monument agora cabe com qualquer fonte.
- As referências analisadas até agora são landonorris.com e tasteskill.dev. `why.zero.university` e `auge-xp.com` não abriram e ainda não têm notas.
- Uma skill eleva o piso e dá um processo ao agente. Prêmios ainda dependem da ideia, do conteúdo e do gosto de quem dirige o trabalho.

## Roadmap

- [ ] Análises de `why.zero.university` e `auge-xp.com`
- [ ] Starter opcional com cena Three.js
- [ ] Versão dos componentes para React / Next
- [ ] Benchmarks contra um baseline sem a skill, com comparação cega

## Contribuindo

Issues e pull requests são bem-vindos. Leia o [CONTRIBUTING.md](CONTRIBUTING.md) e rode `python3 tools/validate.py` antes de abrir um PR.

## Créditos e aviso

- Ideias de processo (inventário, frase da ideia, inspetor em navegador real, loop de olhar e corrigir) foram informadas pelo [Taste Skill](https://www.tasteskill.dev/).
- As notas sobre landonorris.com vêm do código público da página e de matérias públicas (Awwwards, DesignRush, Codrops, Syntax). Este projeto não é afiliado a Lando Norris, McLaren, OFF+BRAND, Awwwards nem ao Taste Skill.
- GSAP (GreenSock, gratuito pela licença padrão), Lenis (MIT), Three.js e Rive pertencem aos seus autores e são carregados de CDNs, não incluídos aqui.
- As imagens do starter editorial são placeholders abstratos gerados para este projeto.

## Licença

[MIT](LICENSE)
