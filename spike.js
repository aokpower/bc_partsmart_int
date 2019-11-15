// Utility:
const promiseTimeout = (ms, promise) => {
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('Timed out in '+ms+' ms.');
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

const handleResponseError = (response) => {
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response;
}

// Integration:
class MyBC {
  carts() {
    const get_cart_path = '/api/storefront/carts?include=';
    const base_options = {
      'credentials': 'include',
      'headers': {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    return fetch(get_cart_path, base_options).then(r => r.json());
  };

  async addItem(productId, quantity) {
    const payload = JSON.stringify({
      'lineItems': [
        {
          "productId": String(productId),
          "quantity": Number(quantity)
        }
      ]
    });
    /* Why is get cartId logic not extracted to a separate fn?
        Because if there's no cart, you need an item to start
        a new one with. */
    const cs = await this.carts();
    let cart_endpoint;
    if (cs.length !== 0) { // if cart already exists, use it
      cart_endpoint = '/api/storefront/carts/' + cs[0].id + '/items';
    }
    else { // if cart doesn't exist, make a new one
      cart_endpoint = '/api/storefront/cart';
    }

    const res = await fetch(cart_endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    // TODO: if res.ok { return await res.json() } else { promise.reject(err)? }
    return await res.json();
  };
}

class IdLookup {
  constructor(config) {
    this.config = config;
  }

  check(ari_sku) {
    return new Promise((resolve, reject) => {
      fetch(this.config.host, this.config.options)
        .then(handleResponseError)
        // .then(...
        // .catch(err => ...
    });
  }
}


// Main
var bc = new MyBC();

// errors if => fn form is used
function addToCartARI(params_str) {
  // Convert string input into object
  const params = params_str.split("&")
    .map(param_str => param_str.split("="))
    .reduce((obj, param_pair) => {
      obj[param_pair[0]] = param_pair[1];
      return obj;
    }, {});

  id_lookup(params.arisku).then(id => {
    bc.addItem(id)
  }).catch(err => console.log(err.message))

  // Lookup sku to BC id from custom service
}
