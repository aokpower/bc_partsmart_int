// Utility functions
const sleep = ms => {
    return new Promise(r => setTimeout(r, ms));  
}

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
