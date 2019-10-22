// Utility functions
const sleep = ms => {
    return new Promise(r => setTimeout(r, ms));  
}

/*
// Convenience function as I'm trying to debug socket hangup issue
// TODO: Convert to handling http ok codes
const fetch_retry = (url, options, n_attempts) => {
    fetch(url, options).catch(error => {
        if (n_attempts === 1) throw error; // recursion base case as early throw conditional
        return fetch_retry(url, options, (n_attempts - 1));
    });
}

const base_options = {
    'credentials': 'include',
    'headers': {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};
*/

/*
let add_li_path = (cart) => {
    return '/carts/' + cart.id + '/items';
}

const add_li_payload = (id, quantity) => {
    return Object.assign({
        'body': {
            'lineItems': [
                {
                    'quantity': quantity,
                    'productId': id
                }
            ]
        }
    }, {
            method: 'POST',
            mode: 'no-cors', // not sure if needed
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
}

let post_li_to_cart = async(id, quantity) => {
    const cart = await getCart().then(cs => cs[0]);
    const path = add_li_path(cart);
    const payload = add_li_payload(id, quantity);
    return fetch(path, payload);
}

const product_id = 112; // hard coded product id of test product in store
var path;
getCart().then(cs => path = add_li_path(cs[0]));
const payload = add_li_payload(product_id, 1);

const fetch_until_ok = (url, options, n_attempts) => {
    fetch(url, options).then(res => {
        if (!res.ok) {
            if (n_attempts === 1) throw "No more retries.";
            return fetch_until_ok(url, options, (n_attempts - 1));
        } else {
            return res;
        }
    });
}
*/

const getCarts = () => {
  const get_cart_path = '/api/storefront/carts?include=';
  const base_options = {
    'credentials': 'include',
    'headers': {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  return fetch(get_cart_path, base_options)
    .then(r => r.json());
}

// Note: line items should just be array of li objects
/*
TODO: Only .json() response if response code is good otherwise throw b/c:
currently, if response is a 504 with no body then it throws a JSON parser error
*/
const addItemToCart = async(line_items) => {
  // Note: Assumes first cart returned by getCart is target cart if one isn't
  // provided
  let cartId = await getCarts().then(carts => {
    if (carts.length === 0) throw new Error("No carts available to post to.");
    // TODO: Make cart if there isn't one already *IMPORTANT*
    return carts[0].id;
  });
  // post line item to cart
  const cart_endpoint = '/api/storefront/carts/' + cartId + '/items';
  const payload = JSON.stringify({ 'lineItems': line_items });

  const response = await fetch(cart_endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json" },
    body: payload, 
  });
  return response.json()
}

// TODO: get exact parameter info for hook Fn
const addToCartHook = (info) => {

  // should be able to concurrently get ids for skus from the partsmart callback
  // info
}
