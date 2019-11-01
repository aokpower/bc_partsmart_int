function MyBC(params) {
  this.carts = () => {
    const get_cart_path = '/api/storefront/carts?include=';
    const base_options = {
      'credentials': 'include',
      'headers': {
        'Accept':       'application/json',
        'Content-Type': 'application/json'
      }
    };
    return fetch(get_cart_path, base_options).then(r => r.json());
  }

  this.addItem = (productId, quantity) => {
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
    return this.carts().then(cs => {
      let cart_endpoint;
      if (cs.length !== 0) { // if cart already exists, use it
        cart_endpoint = '/api/storefront/carts/' + cs[0].id + '/items';
      } else {               // if cart doesn't exist, make a new one
        cart_endpoint = '/api/storefront/cart';
      }
        return fetch(cart_endpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: payload, 
        });
    }).then(res => res.json());
  }
}

const id_lookup = (ari_id) => {
  /*
    things that can happen from service:
      - Service isn't reachable (failure state)
      - Service returns Error   (failure state)
      - No record found         (failure state)
      - Record found with id    (Success state)
  */
  fetch
}

// errors if fn def form (const addToCartARI = ... is used, idk why)
function addToCartARI(params_string) => {
  // Convert string input into object
  const params = params_string.split("&")
    .map(param_string => param_string.split("="))
    .reduce((obj, param_pair) => {
      obj[param_pair[0]] = param_pair[1];
      return obj;
    }, {});

  // Lookup sku to BC id from custom service
  /*


    Then need to pass that value to addToCartBC and handle possible states there

  */

}
