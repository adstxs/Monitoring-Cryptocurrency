// Init
const BASE_ENDPOINT = "https://indodax.com";
let coins;
let coinsName = [];
let selectedCoin = "btc_idr/btc";

renderCoinDetail(selectedCoin);
renderCoins();

// Alertify
alertify.notify("Selamat datang di aplikasi monitoring cryptocurrency.", "custom", 2.5);
setTimeout(() => {
  alertify.notify("Data diperbarui setiap 10s.", "custom", 2.5);
}, 1250);

// Helper
function linkIdFormat(tickerId, urlLogo) {
  return `${tickerId}/${urlLogo.split("/").pop().replace(".svg", "")}`;
}

function descFormat(tickerId) {
  return tickerId.replace("_", "/").toUpperCase();
}

function currencyFormat(number, type) {
  if (type === "IDR") {
    return Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(number);
  } else {
    return Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 10 }).format(number);
  }
}

function volumeFormat(value, coin) {
  return `${parseFloat(value).toFixed(1)} ${coin}`;
}

function dateFormat(unixTimestamp) {
  const datetime = new Date(unixTimestamp * 1000);
  options = {
    // weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
    timeZoneName: "short",
  };
  return new Intl.DateTimeFormat("id", options).format(datetime).replaceAll(".", ":");
}

// Coin Detail
function getCoinDetail(tickerId) {
  const pairId = tickerId.replace("_", "");
  return fetch(`${BASE_ENDPOINT}/api/ticker/${pairId}`)
    .then((response) => response.json())
    .then((response) => response.ticker);
}

async function renderCoinDetail(linkId) {
  const arr = linkId.split("/");
  const tickerId = arr[0];
  const logoName = arr[1];
  const coinDetail = await getCoinDetail(tickerId);
  updateUiDetail(tickerId, logoName, coinDetail);
}

function updateUiDetail(tickerId, logoName, coinDetail) {
  document.querySelector(".logo").src = `https://indodax.com/v2/logo/svg/color/${logoName}.svg`;
  document.querySelector(".coin-desc").innerHTML = descFormat(tickerId);

  const arr = tickerId.split("_");
  const coin = arr[0].toUpperCase();
  const currency = arr[1].toUpperCase();

  document.querySelector(".vol_coin_label").innerHTML = `Volume (${coin})`;
  document.querySelector(".vol_currency_label").innerHTML = `Volume (${currency})`;

  Object.entries(coinDetail).forEach(([key, value], index) => {
    if (index === 7) {
      highlight(key, value, key);
      document.querySelector(`.${key}`).innerHTML = dateFormat(value);
    } else if (index === 3) {
      highlight(key, value, "vol_currency");
      document.querySelector(".vol_currency").innerHTML = currencyFormat(value, currency);
    } else if (index === 2) {
      highlight(key, value, "vol_coin");
      document.querySelector(".vol_coin").innerHTML = volumeFormat(value, coin);
    } else {
      highlight(key, value, key);
      document.querySelector(`.${key}`).innerHTML = currencyFormat(value, currency);
    }
  });
}

function highlight(key, value, className) {
  const e = document.querySelector(`.${className}`);
  if (value > e.dataset.val) {
    addRemoveClass(e, "increase");
    console.log(key, "increase", `now: ${value}, last: ${e.dataset.val}`);
  } else if (value < e.dataset.val) {
    addRemoveClass(e, "decrease");
    console.log(key, "decrease", `now: ${value}, last: ${e.dataset.val}`);
  }
  e.dataset.val = value;
}

function addRemoveClass(e, className) {
  e.classList.add(className);
  setTimeout(() => {
    document.querySelectorAll(`.${className}`).forEach((e) => {
      e.classList.remove(className);
    });
  }, 2000);
}

// jQuery - Create Pagination
function paginate(data) {
  $(".total").html(`Total : ${data.length}`);
  $(".pagination-container").pagination({
    dataSource: data,
    pageSize: 20,
    pageRange: 1,
    //showPrevious: false,
    //showNext: false,
    callback: function (data) {
      const html = updateUi(data);
      $(".coin-container").html(html);
    },
  });
}

// Coins
function getCoins() {
  return fetch(`${BASE_ENDPOINT}/api/pairs`)
    .then((response) => response.json())
    .then((response) => response);
}

async function renderCoins() {
  coins = await getCoins();
  coins.forEach((c) => {
    coinsName.push(c.description);
  });
  // updateUi(coins);
  paginate(coins);
}

function renderCoinsWithCategory(category = "ALL") {
  if (category === "ALL") {
    // updateUi(coins);
    paginate(coins);
    coinsName = coins.map((c) => c.description);
  } else {
    // updateUi(coins.filter((c) => c.description.includes(`/${category}`)));
    paginate(coins.filter((c) => c.description.includes(`/${category}`)));
    coinsName = coins.filter((c) => c.description.includes(`/${category}`)).map((c) => c.description);
  }
  // jQuery - Update AutoComplete Source
  $(".search-input").autocomplete("option", "source", coinsName);
}

function updateUi(coins) {
  // document.querySelector(".total").innerHTML = `Total : ${coins.length}`;
  let cards = "";
  coins.forEach((c) => (cards += makeCards(c)));
  const coinContainer = document.querySelector(".coin-container");
  coinContainer.innerHTML = cards;
}

function makeCards(c) {
  return `
    <div class="card py-1" style="min-width: 8rem">
      <img src="${c.url_logo}" alt="Logo Coin" class="logo" />
      <a href="#" data-link-id="${linkIdFormat(c.ticker_id, c.url_logo)}" class="link">
        ${descFormat(c.ticker_id)}
      </a>
    </div>
  `;
}

// Binding Event
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("link")) {
    selectedCoin = e.target.dataset.linkId;
    document.querySelectorAll("div > p + p").forEach((p) => {
      delete p.dataset.val;
    });
    renderCoinDetail(selectedCoin);
  } else if (e.target.classList.contains("category-item")) {
    const current = document.querySelector(".category-item-active");
    current.classList.remove("category-item-active");
    e.target.classList.add("category-item-active");
    renderCoinsWithCategory(e.target.innerHTML);
  }
});

// Update Data Every 10s
setInterval(() => {
  renderCoinDetail(selectedCoin);
  console.log("update");
}, 10000);

// jQuery - AutoComplete Search
$(document).ready(function () {
  function getFilteredCoins(keyword) {
    const activeCategory = $(".category-item-active").html();
    if (activeCategory === "ALL") {
      return coins.filter((c) => c.description.includes(keyword.toUpperCase()));
    } else {
      const availableCoins = coins.filter((c) => c.description.includes(`/${activeCategory}`));
      return availableCoins.filter((c) => c.description.includes(keyword.toUpperCase()));
    }
  }

  function searchCoin(keyword) {
    return new Promise((resolve, reject) => {
      const filteredCoins = getFilteredCoins(keyword);
      if (filteredCoins.length) {
        resolve(filteredCoins);
      } else {
        reject(`${keyword} tidak ditemukan`);
      }
    });
  }

  function updateUiNoResults(message) {
    const emptyResults = [];
    paginate(emptyResults);
    $(".coin-container").html(`
      <div class="search-status">
        <img src="img/search-status.svg" alt="Search Status" />
        <p>${message}</p>
      </div>
    `);
  }

  $(".search-input")
    .autocomplete({
      source: coinsName,
    })
    .on("input", function () {
      if ("" === this.value) renderCoinsWithCategory($(".category-item-active").html());
    });

  $(".search-button").click(async () => {
    try {
      const results = await searchCoin($(".search-input").val());
      // updateUi(results);
      paginate(results);
    } catch (error) {
      updateUiNoResults(error);
    }
  });
});
