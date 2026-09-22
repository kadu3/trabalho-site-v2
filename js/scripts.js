// Interações do Açaimoc Delivery

const CHAVE_CARRINHO = "acaimoc_cart";
const LIMITE_COMPLEMENTOS = 4;

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function pegarCarrinho() {
    const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO);
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
}

function salvarCarrinho(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
    atualizarCarrinho();
}

function adicionarAoCarrinho(produto) {
    const carrinho = pegarCarrinho();

    produto.id = Date.now() + Math.random();
    carrinho.push(produto);

    salvarCarrinho(carrinho);
    mostrarAviso("Açaí adicionado ao carrinho! 💜");
}

function removerDoCarrinho(id) {
    const carrinho = pegarCarrinho();
    const novoCarrinho = carrinho.filter(item => String(item.id) !== String(id));

    salvarCarrinho(novoCarrinho);
}

function atualizarCarrinho() {
    const carrinho = pegarCarrinho();
    const quantidade = carrinho.length;

    const total = carrinho.reduce((soma, item) => {
        return soma + Number(item.preco || 0);
    }, 0);

    document.querySelectorAll("[data-cart-count]").forEach(elemento => {
        elemento.textContent = quantidade;
    });

    const lista = document.querySelector("#cartItems");
    const totalCarrinho = document.querySelector("#cartTotal");

    if (lista) {
        if (carrinho.length === 0) {
            lista.innerHTML = `
                <p class="text-muted text-center py-4">
                    Seu carrinho está vazio.
                </p>`;
        } else {
            lista.innerHTML = carrinho.map(item => `
                <div class="cart-item">
                    <div>
                        <strong>${item.nome}</strong>
                        <div class="small text-muted">${item.detalhes || ""}</div>
                    </div>
                    <div class="text-end">
                        <strong>${formatarMoeda(item.preco)}</strong>
                        <button
                            class="btn btn-sm btn-link text-danger p-0 d-block ms-auto"
                            data-remove-cart="${item.id}"
                            type="button">
                            Remover
                        </button>
                    </div>
                </div>
            `).join("");

            lista.querySelectorAll("[data-remove-cart]").forEach(botao => {
                botao.addEventListener("click", () => {
                    removerDoCarrinho(botao.dataset.removeCart);
                });
            });
        }
    }

    if (totalCarrinho) {
        totalCarrinho.textContent = formatarMoeda(total);
    }

    const botaoFinalizar = document.querySelector("#goCheckout");
    if (botaoFinalizar) {
        botaoFinalizar.classList.toggle("disabled", carrinho.length === 0);
    }
}

function mostrarAviso(mensagem) {
    let aviso = document.querySelector("#acaiToast");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "acaiToast";
        aviso.className = "acai-toast";
        document.body.appendChild(aviso);
    }

    aviso.textContent = mensagem;
    aviso.classList.add("show");

    setTimeout(() => {
        aviso.classList.remove("show");
    }, 2200);
}

function criarCarrinho() {
    if (document.querySelector("#cartOffcanvas")) {
        return;
    }

    const menu = document.querySelector("#mainNav .container");

    if (menu) {
        const botaoCarrinho = document.createElement("button");

        botaoCarrinho.type = "button";
        botaoCarrinho.className = "btn btn-cart ms-lg-3";
        botaoCarrinho.setAttribute("data-bs-toggle", "offcanvas");
        botaoCarrinho.setAttribute("data-bs-target", "#cartOffcanvas");
        botaoCarrinho.innerHTML = `
            🛒 Carrinho
            <span class="cart-count" data-cart-count>0</span>
        `;

        menu.appendChild(botaoCarrinho);
    }

    document.body.insertAdjacentHTML("beforeend", `
        <div
            class="offcanvas offcanvas-end"
            tabindex="-1"
            id="cartOffcanvas"
            aria-labelledby="cartTitle">

            <div class="offcanvas-header">
                <h3 class="offcanvas-title fw-bold" id="cartTitle">
                    Seu carrinho 💜
                </h3>
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="offcanvas"
                    aria-label="Fechar">
                </button>
            </div>

            <div class="offcanvas-body d-flex flex-column">
                <div id="cartItems" class="flex-grow-1"></div>

                <div class="cart-total">
                    <span>Total</span>
                    <strong id="cartTotal">R$ 0,00</strong>
                </div>

                <a
                    id="goCheckout"
                    href="store.html"
                    class="btn btn-primary btn-lg w-100 mt-3">
                    Ir para finalização
                </a>
            </div>
        </div>
    `);
}

function configurarProdutos() {
    const produtos = document.querySelectorAll("[data-product]");

    produtos.forEach(produto => {
        const botao = produto.querySelector("[data-add-product]");

        if (!botao) {
            return;
        }

        botao.addEventListener("click", () => {
            const nome = produto.dataset.product;
            const precos = JSON.parse(produto.dataset.prices || "{}");
            const seletorTamanho = document.querySelector("#quickSize");
            const nomeProduto = document.querySelector("#quickProductName");

            nomeProduto.textContent = nome;

            seletorTamanho.innerHTML = Object.entries(precos)
                .map(([tamanho, preco]) => `
                    <option value="${tamanho}" data-price="${preco}">
                        ${tamanho} ml — ${formatarMoeda(Number(preco))}
                    </option>
                `)
                .join("");

            document.querySelector("#quickAdd").onclick = () => {
                const opcao = seletorTamanho.options[seletorTamanho.selectedIndex];

                adicionarAoCarrinho({
                    nome: nome,
                    preco: Number(opcao.dataset.price),
                    detalhes: `${opcao.value} ml • combinação pronta`
                });

                bootstrap.Modal
                    .getInstance(document.querySelector("#quickModal"))
                    .hide();
            };

            new bootstrap.Modal(document.querySelector("#quickModal")).show();
        });
    });
}

function configurarMontagem() {
    const formulario = document.querySelector("#builderForm");

    if (!formulario) {
        return;
    }

    const total = document.querySelector("#builderTotal");
    const complementos = [
        ...formulario.querySelectorAll(".topping-option input[data-extra]")
    ];
    const contador = document.querySelector("#toppingCount");

    function atualizarPreco() {
        const tamanho = formulario.querySelector("input[name='size']:checked");
        let preco = Number(tamanho?.dataset.price || 14);

        formulario.querySelectorAll("input[data-extra]:checked").forEach(item => {
            preco += Number(item.dataset.extra);
        });

        total.textContent = formatarMoeda(preco);
    }

    function atualizarLimiteDeComplementos() {
        const quantidade = complementos.filter(item => item.checked).length;

        if (contador) {
            contador.textContent = `${quantidade}/${LIMITE_COMPLEMENTOS} selecionados`;
        }

        complementos.forEach(item => {
            item.disabled = !item.checked && quantidade >= LIMITE_COMPLEMENTOS;
        });
    }

    complementos.forEach(item => {
        item.addEventListener("change", () => {
            const quantidade = complementos.filter(opcao => opcao.checked).length;

            if (quantidade > LIMITE_COMPLEMENTOS) {
                item.checked = false;
                mostrarAviso(`Você pode escolher no máximo ${LIMITE_COMPLEMENTOS} complementos.`);
            }

            atualizarLimiteDeComplementos();
            atualizarPreco();
        });
    });

    formulario.addEventListener("change", atualizarPreco);

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const tamanho = formulario.querySelector("input[name='size']:checked");
        const escolhidos = [
            ...formulario.querySelectorAll("input[data-extra]:checked")
        ];

        const detalhes = [
            tamanho.value,
            ...escolhidos.map(item => item.value)
        ].join(" • ");

        let preco = Number(tamanho.dataset.price || 14);

        escolhidos.forEach(item => {
            preco += Number(item.dataset.extra);
        });

        adicionarAoCarrinho({
            nome: "Meu Açaí Personalizado",
            preco: preco,
            detalhes: detalhes
        });
    });

    atualizarLimiteDeComplementos();
    atualizarPreco();
}

function configurarFinalizacao() {
    const resumo = document.querySelector("#checkoutItems");

    if (!resumo) {
        return;
    }

    function mostrarResumo() {
        const carrinho = pegarCarrinho();
        let total = 0;

        if (carrinho.length === 0) {
            resumo.innerHTML = `
                <p class="text-muted">
                    Nenhum item no carrinho. Volte ao cardápio para escolher.
                </p>`;
        } else {
            resumo.innerHTML = carrinho.map((item, indice) => {
                total += Number(item.preco);

                return `
                    <div class="checkout-item">
                        <span>
                            <strong>${indice + 1}. ${item.nome}</strong>
                            <small>${item.detalhes || ""}</small>
                        </span>
                        <strong>${formatarMoeda(item.preco)}</strong>
                    </div>
                `;
            }).join("");
        }

        document.querySelector("#checkoutTotal").textContent = formatarMoeda(total);
        document.querySelector("#finishOrder").disabled = carrinho.length === 0;
    }

    mostrarResumo();

    const formulario = document.querySelector("#checkoutForm");

    formulario?.addEventListener("submit", evento => {
        evento.preventDefault();

        const carrinho = pegarCarrinho();

        if (carrinho.length === 0) {
            return;
        }

        const nome = document.querySelector("#customerName").value.trim();
        const numeroPedido = Math.floor(1000 + Math.random() * 9000);

        document.querySelector("#orderNumber").textContent = `#${numeroPedido}`;
        document.querySelector("#customerResult").textContent =
            `Tudo certo, ${nome}! Seu pedido foi registrado e já pode ser preparado.`;

        document.querySelector("#checkoutSuccess").classList.remove("d-none");

        localStorage.removeItem(CHAVE_CARRINHO);
        atualizarCarrinho();
        mostrarResumo();

        window.scrollTo({
            top: document.querySelector("#checkoutSuccess").offsetTop - 80,
            behavior: "smooth"
        });
    });
}

function marcarDiaAtual() {
    const dias = document.querySelectorAll(".list-hours li");

    if (!dias.length) {
        return;
    }

    const diaDaSemana = new Date().getDay();
    const indice = diaDaSemana === 0 ? 6 : diaDaSemana - 1;

    dias[indice]?.classList.add("today");
}

window.addEventListener("DOMContentLoaded", () => {
    criarCarrinho();
    atualizarCarrinho();
    configurarProdutos();
    configurarMontagem();
    configurarFinalizacao();
    marcarDiaAtual();
});
