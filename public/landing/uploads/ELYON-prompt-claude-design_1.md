# ELYON: brief para o Claude Design · v2

> Cole este documento inteiro no Claude Design e anexe os arquivos da seção 3 **na mesma mensagem**.
> O trabalho é feito **em etapas**. Nesta primeira rodada, entregue só o que a seção 13 pede.

---

## 1. Missão

Projetar a **landing page da ELYON** como uma experiência de scroll cinematográfica, em que o visitante *vê o cuidado acontecer*.

A ELYON é um **Sistema Operacional do Cuidado em Saúde**: coloca o paciente no centro e conecta, coordena e acompanha as pessoas, informações e etapas da jornada de cuidado.

A página não apresenta funcionalidades. Ela **demonstra uma jornada**, e cada cena só existe porque a anterior levantou uma pergunta. **O próprio site precisa se comportar como o produto:** preciso, conectado, contínuo, com tecnologia de altíssimo nível que quase não se nota.

**O visitante deve pensar, nesta ordem:**

1. "Isso não parece um site de telemedicina."
2. "Isso parece um sistema inteiro, e muito bem construído."
3. "Entendi. Tudo está conectado ao paciente."
4. "Agora eu sei o que é a ELYON."

**Ordem de raciocínio obrigatória:** conceito → narrativa → direção de arte → interação → código. Nenhuma decisão visual sem uma razão narrativa.

---

## 2. O produto em uma página (fonte da verdade)

| Conceito | Definição que deve guiar o design |
|---|---|
| **ELYON** | Camada operacional do cuidado. O sistema coordena o cuidado ao redor do paciente, e o paciente deixa de ser quem carrega a informação entre consulta, exame, especialista, receita e procedimento. |
| **Paciente** | O centro. Nunca é chamado de "usuário". Visualmente é sempre uma **pessoa real**, e a tecnologia se organiza ao redor dela, sem roubar o protagonismo. |
| **Liz** | Coordenadora do Cuidado. É uma presença humana, serena e profissional que ajuda a navegar pelo sistema. Não é chatbot, robô, mascote nem avatar. **Ela não diagnostica, não prescreve e não decide:** decisões clínicas são sempre de profissionais. |
| **Conecta. Coordena. Eleva.** | Conecta pessoas, informações e etapas. Coordena quem faz o quê, quando e onde. Eleva: clareza para o paciente, contexto para o profissional, organização para a clínica e continuidade para o cuidado. |
| **O ciclo** | decisão → prescrição → execução → registro → acompanhamento → nova decisão. O cuidado sempre **volta para o prontuário** e para o paciente. |

**Peças do sistema** (aparecem como elos da história, nunca como lista):
telemedicina (uma porta de entrada, não o produto) · prontuário (a memória do cuidado) · parecer de especialista (conhecimento incorporado à jornada) · prescrição (ponte entre a decisão e a execução) · medicamento (informação, estimativa de custo e consentimento) · enfermagem e atendimento domiciliar (execução do cuidado) · profissionais, clínicas e clínicas virtuais (a mesma infraestrutura para quem cuida).

**Metáforas internas, que nunca aparecem no texto do site:** "Uber da administração de medicamentos" e "sistema operacional" em sentido técnico.

---

## 3. Assets anexados: leitura e regras

### 3.1 Logo oficial ELYON (`logo-elyon`)

**O que ele é:**
- **Símbolo:** um "Y" formado por **dois braços curvos que convergem** num ponto e continuam como uma haste vertical. No centro, uma **haste mais clara desce** até esse ponto de convergência, onde há um brilho azul.
- **Wordmark:** "ELYON" em sans geométrica **expandida** (larga, cantos arredondados), com o Y em destaque.
- **Divisor:** abaixo do wordmark, uma **linha fina horizontal com um ponto de luz no centro**.
- **Assinatura:** "CONECTA. COORDENA. ELEVA." em caixa-alta com tracking amplo.
- **Acabamento:** 3D, com bisel e brilho.

**O conceito do logo vira a linguagem do site.** Os caminhos convergem num ponto central, e é disso que o site trata:
- **O ponto de convergência = o paciente.** Tudo que se move no site converge para um centro.
- **A haste central = o fio.** Na abertura, a haste desce e se torna o fio que atravessa a página. Nesse momento ele deixa o azul e passa ao **vermelho rubro**.
- **O divisor com o ponto** vira motivo recorrente: um hairline com um nó central, usado como separador e como indicador de conexão.

**Regras:**
- Usar o arquivo exatamente como está. Não redesenhar, não criar versões alternativas e não recriar o símbolo em SVG.
- Aplicar sempre sobre branco, com respiro mínimo igual à altura do "E" do wordmark, e nunca dentro de card ou moldura.
- **O brilho e o 3D pertencem só ao logo.** Nenhum outro elemento do site imita glow, bisel ou luz azul.
- Em tamanho grande, o logo completo aparece na abertura e no fechamento. No header, usar o logo em escala pequena, ou o wordmark isolado se esse arquivo for fornecido. Se ficar ilegível pequeno, **sinalize**, sem improvisar outra versão.

### 3.2 Imagem oficial da Liz (`liz-oficial`)

**O que ela mostra:**
- **Pessoa e figurino:** mulher de cerca de 40 anos, cabelo castanho na altura dos ombros, sorriso sereno e olhar direto para a câmera. Usa jaleco branco com **"LIZ / Coordenadora do Cuidado" bordado em azul-noturno no bolso**.
- **Enquadramento:** ela ocupa o terço direito do quadro.
- **Fundo:** clínica clara e desfocada, com uma recepção de madeira e **profissionais trabalhando atrás dela**, uma janela ampla à direita e uma cadeira azul-noturno.
- **Luz:** clave alta, natural e levemente quente.
- **Resolução:** 1408×768.

**Como usar bem:**
- **Ela está à direita, olhando para nós.** O texto fica à esquerda, ancorado na régua rubro, e ela "apresenta" o texto.
- **O fundo já conta a história.** Os profissionais atrás dela são a coordenação acontecendo. Isso permite um **rack focus** (desfocar e focar planos): primeiro a Liz em foco, depois o fundo ganha nitidez enquanto ela se desfoca, e o cuidado acontecendo ao redor vira o assunto.
- **Recorte e máscara.** Separar a Liz do fundo cria dois planos independentes (ela e a clínica), o que permite parallax e profundidade reais.
- **Harmonização.** A madeira da recepção puxa para o quente. Dessature ou clareie levemente o fundo para conversar com branco e azul-noturno, **sem alterar a pele e o rosto dela**.
- **Bordado.** O bolso já diz "Coordenadora do Cuidado". O rótulo tipográfico ao lado pode ser discreto, sem repetir em tamanho grande.

**Limites:**
- Nunca gerar outra mulher, alterar o rosto, trocar a expressão ou envelhecer/rejuvenescer.
- **Resolução:** 1408px de largura não sustenta um full-bleed nítido em telas retina largas. Use a Liz ocupando até cerca de 55% da largura, ou em full-bleed com o fundo propositalmente desfocado. **Nunca pixelar.** Se precisar de mais resolução, avise.

### 3.3 Outros assets (enviados por cena)
- **Mockup de 5 cenas:** alvo visual definitivo para tipografia, linhas, painéis translúcidos e fotografia.
- **Imagens do Nano Banana:** referência e matéria-prima. Podem ser recortadas, mascaradas, separadas em planos ou reconstruídas em HTML/CSS. Nunca aparecem como foto retangular "colada".
- **Vídeo e apple.com/br:** definem o **nível** de ritmo e transição, não a estrutura nem o conteúdo.

---

## 4. Sistema visual (tokens)

### Cor
> Os azuis foram amostrados do logo oficial. O rubro é um valor provisório: **substituir pelo hex exato usado nos sistemas ELYON**.

```
--white        #FFFFFF   base dominante (~80% da área)
--mist         #F5F7FA   planos de profundidade, fundos de painel
--navy-950     #0C2454   azul-noturno do logo: títulos, marca
--navy-800     #183C6C   azul secundário do logo: ícones de UI, estados
--navy-500     #4A5B78   texto secundário
--slate-400    #8A94A6   legendas, metadados de UI
--line         #E3E7EE   divisórias neutras de UI
--rubro        #A01C2E   ← SUBSTITUIR pelo rubro oficial dos sistemas
--rubro-soft   rubro a 12% de opacidade (fundo de estado ativo, rastro do fio)
```
- `#5B8ECF`, o azul do brilho do logo, **não é cor de interface**. Existe só dentro do logo.
- Sem gradientes perceptíveis, a não ser véus branco→transparente para fundir foto e página.
- Sem roxo, neon, ciano ou "azul de IA".

### Vermelho rubro: o sistema de detalhes finos

O rubro é a **assinatura de precisão** da ELYON, como já acontece nos sistemas do produto. Ele aparece **em pouca área e em muitos lugares certos**, como fio de costura, e nunca como mancha.

| Detalhe | Especificação | Onde aparece |
|---|---|---|
| **O fio** | curva contínua de 1.25px desenhada pelo scroll | liga cada peça da jornada à próxima e fecha o ciclo no paciente |
| **Régua** | vertical de 1–1.5px e 32–56px de altura | à esquerda de cada fala e de cada bloco de texto |
| **Colchetes** | cantos em L, 1px, 16–24px | enquadram o paciente e o elemento em foco |
| **Nós** | pontos de 4–6px | onde o fio toca uma peça: consulta, parecer, prescrição, tarefa |
| **Hairline com nó** | derivado do divisor do logo | separadores entre falas e no rodapé de painéis |
| **Estados de UI** | ponto de status de 6px, sublinhado ativo de 1px, borda esquerda de 2px no item selecionado | dentro dos painéis do produto |
| **Progresso** | trilho neutro com preenchimento rubro de 1px | indicador de scroll no canto e etapas da jornada |
| **Marcadores de tempo** | tick de 1px e horário em `--navy-500` | linha do tempo do prontuário |
| **Foco** | contorno de 1.5px | acessibilidade de teclado |

**Regras do rubro:**
- **Área:** nunca mais que ~3–5% da área de uma tela.
- **Proibido:** botão preenchido, bloco de fundo, texto longo, ícone grande e glow.
- **Nas palavras:** em texto, no máximo **uma** palavra ou marcador por tela (ex.: o ponto final de uma frase-chave ou um "●" de status).
- **Hierarquia:** o azul-noturno dá **estrutura** e o rubro dá **conexão e atenção**. Se algo está conectado, ativo ou acontecendo agora, ele toca o rubro.

### Tipografia
- **Títulos e corpo:** sans humanista-geométrica leve (não serifa) que converse com o wordmark expandido sem imitá-lo. Sugestões: *Manrope*, *Sora* ou *Inter Tight*.
- **Rótulos e eyebrows:** caixa-alta pequena com tracking de 0.18–0.24em, ecoando "CONECTA. COORDENA. ELEVA.".
- **Padrão de título:** frase em peso 300 com a palavra-chave em 600. Ex.: "O cuidado não deveria ser **fragmentado.**"
- **Escala:** display 64–88px / H2 40–56px / corpo 17–19px / UI 12–14px.
- **Números em UI:** algarismos tabulares (`font-variant-numeric: tabular-nums`) para horários e doses.
- **Falas:** curtas, de no máximo 2 linhas, sempre ancoradas à régua rubro.

### Fotografia
- Clave alta, clara e com luz natural, consistente com a foto da Liz, que é a **referência de luz** para todas as outras imagens.
- Pessoas reais em momentos de cuidado, sem pose de banco de imagem.

### Interfaces do produto
- **Painéis translúcidos:** branco a ~80% com desfoque de 20–30px do fundo, borda de 1px `--line` e sombra quase imperceptível (`0 1px 2px` + `0 24px 48px` a 4–6%).
- **Profundidade:** posicionados em **perspectiva 3D** (`perspective: 1600px`, rotação de 4–12°) e em camadas.
- **Conteúdo:** plausível, em português e com **detalhes rubro** (status, item ativo, nó do fio). Todos os dados de pacientes são fictícios.
- **Painel protagonista:** o mesmo painel persiste e se transforma ao longo da história: videochamada → registro → parecer anexado → prescrição → tarefa de enfermagem → registro de volta.

### Layout
- Grid de 12 colunas, margem lateral de 64–120px no desktop e 20px no mobile.
- Muito espaço em branco. **Menos elementos, mais impacto.**
- **Header fixo:** logo à esquerda; "Sistema Operacional do Cuidado em Saúde" e menu à direita; hairline inferior que aparece ao rolar.
- **Indicador de progresso** vertical no canto, com trilho neutro e preenchimento rubro, e os nós das cenas marcados.

---

## 5. Tecnologia e engenharia de movimento

> A qualidade técnica é parte da mensagem: **um sistema que coordena o cuidado precisa parecer impecavelmente engenheirado.**
> A tecnologia deve aparecer como **precisão**, e não como efeito.

### 5.1 Stack de movimento
- **Protótipo:** GSAP + **ScrollTrigger** (pinning e scrub), **Lenis** (smooth scroll com inércia sutil), plugins GSAP de texto e SVG (**SplitText**, **DrawSVG**, **MorphSVG**), CSS 3D transforms, `clip-path` e `mask-image`.
- **Handoff:** a mesma lógica deve ser portável para **Next.js + TypeScript + React**, com GSAP/ScrollTrigger e Lenis, ou Framer Motion (`useScroll`, `layoutId`) onde fizer mais sentido. Componentes reais, sem peças que ainda não são usadas.
- **Recursos nativos quando possível:** View Transitions API, `scroll-timeline`/`animation-timeline` com fallback.

### 5.2 Parâmetros globais

| Parâmetro | Valor |
|---|---|
| Propriedades animadas | apenas `transform`, `opacity`, `filter: blur()` (máx. 12px), `clip-path`, `mask-position`, `stroke-dashoffset` |
| Easing de entrada | `cubic-bezier(0.22, 1, 0.36, 1)` (expo out) |
| Easing de transformação | `cubic-bezier(0.65, 0, 0.35, 1)` (in-out suave, para morphs e câmera) |
| Durações | micro 180–320ms · entradas 700–1100ms · cenas controladas pelo scroll |
| Scrub | `scrub: 0.6–1` (o movimento acompanha o dedo com um leve atraso elegante) |
| Stagger | 40–80ms entre linhas e elementos irmãos |
| Proibido | bounce, spring exagerado, partículas, glow fora do logo, glitch, hologramas, typewriter, WebGL decorativo |

### 5.3 Catálogo de transições premium
Cada cena usa **uma transição principal** do catálogo. As transições não se acumulam.

| # | Nome | O que acontece | Função narrativa |
|---|---|---|---|
| **T1** | **Convergência** | elementos percorrem trajetórias curvas, **como os braços do logo**, até um ponto central | tudo converge para o paciente |
| **T2** | **Desenho do fio** | o fio rubro se desenha com o scroll e deixa um nó ao tocar cada peça | conecta |
| **T3** | **Morph do painel** | o painel protagonista muda de conteúdo e forma com transição de elemento compartilhado (FLIP / `layoutId`) e crossfade interno | a informação continua, não recomeça |
| **T4** | **Rack focus** | o plano da frente desfoca enquanto o de trás ganha nitidez (usa a Liz recortada sobre o fundo da clínica) | muda o assunto sem cortar a cena |
| **T5** | **Revelação por máscara** | imagem ou painel surge por `clip-path` que se abre a partir do nó do fio | o cuidado "abre" um novo espaço |
| **T6** | **Texto por linha** | frases entram linha a linha com máscara (SplitText + `overflow: hidden`, deslocamento de 100%→0), e a palavra-chave ganha peso por último | a leitura conduz o ritmo |
| **T7** | **Dolly-out** | a câmera se afasta (`scale` + perspectiva) e revela que a cena era parte de algo maior | do paciente para a clínica e para a rede |
| **T8** | **Retorno** | o fio refaz o caminho e um registro "sobe" de volta ao painel e ao paciente | o ciclo fecha |
| **T9** | **Parallax de profundidade** | 3 planos (fundo, pessoa, UI) com velocidades 0.9 / 1 / 1.08 | profundidade real e discreta |

### 5.4 Microinterações que mostram tecnologia viva
Aparecem em escala pequena, dentro dos painéis e durante a cena, não em loop eterno:
- ponto rubro de status que muda de "Solicitado" para "Em andamento" e depois "Concluído";
- horário que avança discretamente numa tarefa de enfermagem;
- linha do prontuário que se insere empurrando as demais (FLIP);
- indicador sutil de "parecer recebido", com nó rubro pulsando **uma vez**;
- cursor magnético leve no CTA final, com deslocamento de no máximo 6px.

### 5.5 Continuidade
- **Nada de corte seco:** pelo menos um elemento sempre atravessa de uma cena para a outra (o fio, o paciente ou o painel protagonista).
- **Reversibilidade:** todo movimento é reversível ao rolar para cima.
- **Cenas cheias:** ficam fixadas (pinned) por ~200–300vh, com 3 a 4 estados internos.
- **Batidas curtas** (★): ~100vh, com uma frase e uma transformação.

**Estrutura de toda cena:**
1. apresenta algo;
2. responde parcialmente a uma pergunta;
3. transforma a composição;
4. **deixa a pergunta que abre a próxima cena**.

### 5.6 Performance (inegociável)
- **Fluidez:** 60fps em notebook comum. `will-change` só durante a animação.
- **Carregamento:**
  - LCP abaixo de 2.5s, com a abertura carregando só o logo, a Liz e as fontes;
  - demais imagens em AVIF/WebP responsivas, com lazy loading por cena;
  - fontes com `font-display: swap` e subset latino;
  - nada de vídeo pesado acima da dobra.
- **`prefers-reduced-motion`:** sem pinning, parallax ou scrub. Fades simples e o fio já desenhado por completo.

---

## 6. Roteiro cena a cena

> A copy é um **rascunho direcional** em PT-BR e pode ser refinada, mantendo a função narrativa. ★ = batida curta.

### 00 · Abertura (automática, entre 3 e 5 segundos, com opção de pular)
- **Visual:** tela branca → **o logo se revela**: os braços se desenham em T1 até o ponto de convergência → o wordmark entra → "CONECTA. COORDENA. ELEVA." entra em T6 → a Liz surge à direita em fade com leve desfoque → frase.
- **Copy:** "Cuidar é **conectar** tudo o que importa."
- **Transição:** o logo sobe para o header. **A haste central desce, deixa o azul, vira rubro e torna-se o fio** (T2). O scroll é liberado sem clique.

### 01 · Fragmentação e Liz
- **Visual:** a Liz à direita. Fragmentos do cuidado (um exame, uma receita, uma notificação de consulta, uma mensagem) flutuam **desconectados**, em planos diferentes e sem nós nem fio. Com o scroll, rack focus (T4): o fundo da clínica ganha nitidez e mostra profissionais trabalhando isolados.
- **Copy:** "O cuidado não deveria ser **fragmentado.**" / rótulo "LIZ · COORDENADORA DO CUIDADO"
- **Pergunta que fica:** *então o que organiza tudo isso? Quem está no centro?*

### 02 · O paciente
- **Visual:** os fragmentos fazem **convergência** (T1) e orbitam uma pessoa. Os colchetes rubro a enquadram. O fio chega e deixa o primeiro nó.
- **Copy:** "No centro, **uma pessoa.**" / "A ELYON coordena o cuidado ao redor dela."
- **Pergunta:** *e como esse cuidado começa?*

### 03 · Telemedicina, a porta de entrada
- **Visual:** o cartão-foto do paciente gira em perspectiva e se torna o **painel protagonista**: uma videochamada com um médico. O ponto rubro "Em consulta" fica ativo.
- **Copy:** "Uma consulta é **o começo**, não o fim."
- **Pergunta:** *o que acontece com o que foi dito ali?*

### 04 · Prontuário ★
- **Visual:** T3. A chamada se recolhe e vira registro. As linhas do histórico se inserem com FLIP, com ticks rubro na linha do tempo.
- **Copy:** "O cuidado **deixa memória.**"
- **Pergunta:** *e quando a decisão precisa de outro olhar?*

### 05 · Parecer do especialista
- **Visual:** do registro, o fio se estende (T2) até um cartão de especialista revelado em T5. O caso vai e o **parecer volta** (T8) e se anexa ao prontuário, com o nó pulsando uma vez.
- **Copy:** "Quando a decisão pede **outro olhar**, ele entra na jornada."
- **Pergunta:** *e depois da decisão?*

### 06 · Tratamento e prescrição
- **Visual:** T3. O painel vira prescrição e plano de cuidado. O item principal ganha a borda esquerda rubro de item ativo.
- **Copy:** "A decisão **vira cuidado.**"
- **Pergunta:** *o que o paciente precisa saber antes de começar?*

### 07 · Medicamento ★
- **Visual:** a linha do medicamento se expande com informação clara, estimativa de custo e consentimento (checkbox com o check desenhado em rubro).
- **Copy:** "Clareza **antes** de começar."
- **Pergunta:** *e quem executa esse cuidado?*

### 08 · Enfermagem
- **Visual:** T3. A prescrição vira **tarefa de enfermagem**, com horário, procedimento e local. O fio encontra uma profissional real, revelada em T5, e o status passa de "Solicitado" para "A caminho".
- **Copy:** "O cuidado encontra **quem cuida.**"
- **Pergunta:** *onde isso acontece?*

### 09 · Atendimento domiciliar ★
- **Visual:** a composição se abre para uma casa clara. O procedimento acontece, o status vai para "Concluído" e **o registro sobe de volta** ao painel (T8).
- **Copy:** "Onde o paciente **está.**"
- **Pergunta:** *e quem opera tudo isso?*

### 10 · Profissionais, clínicas e clínicas virtuais
- **Visual:** dolly-out (T7). O mesmo painel mostra agenda, pacientes e fluxos de uma clínica, e em seguida de uma clínica virtual criada por um profissional.
- **Copy:** "A mesma infraestrutura, **para quem cuida.**" / "Uma clínica pode operar seu cuidado dentro da ELYON."
- **Pergunta:** *e quando isso acontece com muitas pessoas?*

### 11 · Rede ★
- **Visual:** dolly-out contínuo. Muitos pacientes, cada um com um fio rubro finíssimo, formam uma trama organizada e calma, sem estética de rede neural ou de constelação.
- **Copy:** "Cada jornada, **conectada.**"

### 12 · Sistema Operacional do Cuidado
- **Visual:** a trama faz **convergência** (T1) no desenho do próprio símbolo: os caminhos viram os braços do Y e o fio vira a haste. **O ciclo fecha** e o logo completo aparece com respiro total.
- **Copy:** "ELYON" / "Sistema Operacional do **Cuidado em Saúde.**" / "Conecta. Coordena. Eleva."
- **CTA:** um único botão sóbrio ("Conhecer a ELYON" ou "Falar com a equipe"), com contorno azul-noturno, preenchimento que sobe em azul-noturno no hover e nó rubro à esquerda.

---

## 7. Mobile

**Recomponha, não encolha.**
- Cenas cheias viram sequências verticais de 2 a 3 telas, com pinning curto ou nenhum.
- O fio vira uma linha vertical contínua à esquerda, que também faz o papel da régua, e ganha nós a cada cena.
- A Liz aparece em recorte vertical (rosto e bolso bordado), com o texto abaixo.
- Painéis frontais com inclinação de no máximo 4°, um por vez.
- Títulos com 36–44px e alvo de toque mínimo de 44px. Lenis desativado no touch.

---

## 8. Acessibilidade e responsabilidade

- **Contraste e texto:** contraste AA. A copy é HTML real e as imagens têm `alt` descritivo.
- **Teclado:** navegação completa, com foco visível no contorno rubro.
- **Saúde:**
  - nenhuma copy sugere que a Liz ou o sistema diagnosticam ou prescrevem; decisão clínica é sempre de profissionais;
  - nada de promessas de cura, resultado ou tempo de atendimento;
  - dados de pacientes são claramente fictícios.

---

## 9. Não fazer

**Estrutura e layout:** landing SaaS padrão (hero → cards → benefícios → depoimentos → CTA) · funcionalidades em lista ou grade · cards coloridos · ícones genéricos em círculos · dashboards genéricos.

**Estética:** gradientes fortes · glassmorphism exagerado · sombras pesadas · neon, roxo ou estética de IA/cyberpunk · hologramas, partículas, explosões de luz · **glow ou 3D fora do logo** · serifas.

**Marca e personagens:** redesenhar o logo · alterar a Liz · usar a Liz como decoração · robôs ou avatares · a palavra "usuário" para o paciente.

**Rubro:** usar como bloco, botão preenchido ou texto longo.

---

## 10. Guia de nomes de arquivo (para referenciar no chat)

```
logo-elyon.png
liz-oficial.jpg
mockup-5-cenas.png
cena03-telemedicina-01.jpg   (padrão: cenaNN-tema-NN)
```

Quando um asset for citado pelo nome no prompt de uma cena, use exatamente aquele arquivo.

---

## 11. Critério de aprovação (autoavaliação antes de entregar)

- [ ] Cada cena termina com uma pergunta que a próxima responde?
- [ ] Algum elemento atravessa cada transição (fio, paciente ou painel)?
- [ ] O paciente parece o centro e a tecnologia está ao redor?
- [ ] O conceito de convergência do logo aparece no movimento?
- [ ] A Liz é a imagem oficial, sem alteração de rosto, nítida e com função na cena?
- [ ] O rubro aparece em detalhes finos, em muitos lugares certos e com pouca área?
- [ ] O glow e o 3D ficaram só no logo?
- [ ] Cada cena usa uma transição principal do catálogo, e não várias ao mesmo tempo?
- [ ] Roda a 60fps, funciona com movimento reduzido e foi recomposto no mobile?
- [ ] Algum trecho parece template ou "site feito por IA"? Se sim, refaça esse trecho.

Liste o que você corrigiu após essa revisão.

---

## 12. Liberdade criativa

Referências não são limitações. Se existir uma solução mais sofisticada que a descrita, proponha e implemente, explicando o porquê.

**O que não é negociável:**
- o logo oficial;
- a identidade da Liz;
- a paleta (azul-noturno do logo, branco e rubro em detalhes finos);
- o paciente no centro;
- uma cena que vende a próxima.

---

## 13. Escopo desta rodada

**Entregue somente:**
1. **Folha de sistema visual:**
   - cores e escala tipográfica;
   - todos os detalhes rubro da tabela da seção 4;
   - painel translúcido em 3 estados e cartão-foto em perspectiva;
   - demonstração isolada de T1, T2, T3 e T6.
2. **Protótipo interativo das cenas 00, 01 e 02**, com scroll real, desktop e mobile.
3. **Nota curta** com as decisões tomadas, as dúvidas sobre os assets (resolução, versão pequena do logo, hex do rubro) e o que foi corrigido na autoavaliação.

**Pare aí** e aguarde revisão. As próximas cenas chegam uma a uma, com suas imagens, e cada nova cena deve conversar visualmente com a anterior.

---

**ELYON** · Sistema Operacional do Cuidado em Saúde · Conecta. Coordena. Eleva.
