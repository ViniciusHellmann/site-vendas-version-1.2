// CONFIGURAÇÕES DO WEBFORGE
// Cole aqui o Project URL e a Publishable key do seu projeto Supabase.
// Use somente a chave publishable/anon no navegador. NUNCA coloque a secret/service_role aqui.
const SUPABASE_URL = "https://voclgnvagmpkvmdknjti.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wA7Zqo4Bc7rRsDZyh2osyA_ngX1ryMe";

// Número do WhatsApp que recebe os pedidos (formato: país + DDD + número).
const WHATSAPP = "5548998457338";

const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_URL.endsWith("voclgnvagmpkvmdknjti.supabase.co") &&
  SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_wA7Zqo4Bc7rRsDZyh2osyA_ngX1ryMe");

const supabaseClient =
  isSupabaseConfigured && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
  const setMenuOpen = open => {
    menu.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menuToggle.textContent = open ? "×" : "☰";
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(!menu.classList.contains("open"));
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  document.addEventListener("click", event => {
    if (
      menu.classList.contains("open") &&
      !menu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const whatsappUrl = () => `https://wa.me/${WHATSAPP}`;
const whatsappFloat = document.getElementById("whatsappFloat");
const footerWhatsapp = document.getElementById("footerWhatsapp");
if (whatsappFloat) whatsappFloat.href = whatsappUrl();
if (footerWhatsapp) footerWhatsapp.href = whatsappUrl();

const reveals = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });

  reveals.forEach(el => observer.observe(el));
} else {
  reveals.forEach(el => el.classList.add("show"));
}

const quoteForm = document.getElementById("quoteForm");
const formStatus = document.getElementById("formStatus");

function setFormStatus(message, kind = "info") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.kind = kind;
}

function openWhatsAppRequest({ name, phone, type, message }, tab = null) {
  const text = `Olá! Meu nome é ${name}.\n\nQuero solicitar um orçamento para:\n${type}\n\nMeu WhatsApp:\n${phone}\n\nDetalhes do projeto:\n${message || "Gostaria de saber mais detalhes."}`;
  const url = `${whatsappUrl()}?text=${encodeURIComponent(text)}`;
  if (tab && !tab.closed) {
    tab.opener = null;
    tab.location.href = url;
  } else {
    window.location.href = url;
  }
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!quoteForm.reportValidity()) return;

    const submitButton = quoteForm.querySelector('button[type="submit"]');
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const type = document.getElementById("type").value;
    const message = document.getElementById("message").value.trim();
    const request = { name, phone, type, message };

    if (name.length < 2 || phone.length < 8 || !type) {
      setFormStatus("Confira seu nome, WhatsApp e tipo de projeto.", "error");
      return;
    }

    // Abre a aba imediatamente no clique para evitar bloqueio após a gravação assíncrona.
    const whatsappTab = window.open("about:blank", "_blank");
    if (whatsappTab) whatsappTab.opener = null;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando solicitação...";
    }

    try {
      if (!supabaseClient) {
        setFormStatus("O armazenamento ainda não foi configurado. O WhatsApp será aberto, mas este pedido não será salvo na nuvem.", "error");
        openWhatsAppRequest(request, whatsappTab);
        return;
      }

      const { error } = await supabaseClient.from("orcamentos").insert({
        nome: name,
        whatsapp: phone,
        tipo_projeto: type,
        mensagem: message || null
      });

      if (error) throw error;

      setFormStatus("Solicitação salva com sucesso! Abrindo o WhatsApp...", "success");
      openWhatsAppRequest(request, whatsappTab);
      quoteForm.reset();
    } catch (error) {
      console.error("Falha ao salvar orçamento no Supabase:", error);
      setFormStatus("Não foi possível salvar na nuvem. Vamos abrir o WhatsApp para você não perder sua solicitação.", "error");
      openWhatsAppRequest(request, whatsappTab);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar pelo WhatsApp →";
      }
    }
  });
}

// Portfólio: filtros de categoria e janela de detalhes acessível.
const portfolioGrid = document.getElementById("portfolioGrid");
const portfolioFilters = document.querySelectorAll(".portfolio-filter");
const portfolioCards = document.querySelectorAll(".portfolio-card");
const portfolioCount = document.getElementById("portfolioCount");
const portfolioDialog = document.getElementById("portfolioDialog");
const portfolioDialogTitle = document.getElementById("portfolioDialogTitle");
const portfolioDialogText = document.getElementById("portfolioDialogText");
const portfolioDialogFeatures = document.getElementById("portfolioDialogFeatures");
const portfolioDialogCta = document.getElementById("portfolioDialogCta");

const portfolioProjects = {
  empresa: {
    title: "NovaForma — Site institucional",
    description: "Conceito para empresas de serviços que precisam apresentar sua marca, explicar seus diferenciais e facilitar o primeiro contato.",
    features: ["Apresentação da empresa e dos serviços", "Seção de diferenciais e indicadores", "Contato e chamada para orçamento"]
  },
  landing: {
    title: "Impulso — Landing page",
    description: "Conceito de página de campanha com uma mensagem central, benefícios claros e uma chamada para ação em destaque.",
    features: ["Conteúdo focado em uma oferta", "Hierarquia visual para leitura rápida", "Botão de conversão em destaque"]
  },
  loja: {
    title: "Atelier — Loja virtual",
    description: "Conceito de e-commerce com uma vitrine elegante, destaque para coleções e navegação pensada para facilitar a descoberta de produtos.",
    features: ["Vitrine de produtos e coleções", "Destaque para novidades", "Estrutura preparada para catálogo e compra"]
  },
  clinica: {
    title: "Clínica Viva — Site profissional",
    description: "Conceito para profissionais e clínicas que desejam transmitir acolhimento, apresentar especialidades e simplificar o agendamento.",
    features: ["Apresentação da equipe e especialidades", "Informações úteis para pacientes", "Chamada para agendamento"]
  },
  turismo: {
    title: "Rota Livre — Landing page de turismo",
    description: "Conceito visual para divulgar destinos, experiências e campanhas de uma agência ou profissional de turismo.",
    features: ["Destaque visual para destinos", "Conteúdo promocional objetivo", "Captação de contatos interessados"]
  },
  tech: {
    title: "PixelLab — Loja de tecnologia",
    description: "Conceito de loja virtual para organizar categorias de produtos, destacar lançamentos e comunicar confiança durante a compra.",
    features: ["Catálogo e categorias de produtos", "Área de destaque para lançamentos", "Mensagens de confiança e suporte"]
  }
};

if (portfolioGrid && portfolioFilters.length && portfolioCards.length) {
  portfolioFilters.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visible = 0;
      portfolioFilters.forEach(item => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      portfolioCards.forEach(card => {
        const show = filter === "todos" || card.dataset.category === filter;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (portfolioCount) portfolioCount.textContent = `${visible} ${visible === 1 ? "conceito" : "conceitos"}`;
    });
  });
}

if (portfolioDialog && portfolioDialogTitle && portfolioDialogText && portfolioDialogFeatures) {
  document.querySelectorAll(".portfolio-details").forEach(button => {
    button.addEventListener("click", () => {
      const project = portfolioProjects[button.dataset.project];
      if (!project) return;
      portfolioDialogTitle.textContent = project.title;
      portfolioDialogText.textContent = project.description;
      portfolioDialogFeatures.replaceChildren();
      project.features.forEach(feature => {
        const item = document.createElement("li");
        item.textContent = feature;
        portfolioDialogFeatures.appendChild(item);
      });
      if (portfolioDialog.showModal) portfolioDialog.showModal();
      else window.alert(`${project.title}\n\n${project.description}\n\n${project.features.join("\n")}`);
    });
  });
  if (portfolioDialogCta) {
    portfolioDialogCta.addEventListener("click", () => {
      if (portfolioDialog.open) portfolioDialog.close();
    });
  }
}
