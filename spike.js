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
    return fetch(get_cart_path, base_options).then(r => { return r.json() });
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
    }).then(res => { return res.json() });
	}
}

/* TODO: Only .json() response if response code is good otherwise throw b/c:
currently, if response is a 504 with no body then it throws a JSON parser error
*/
const addToCartARI = (info) => {
  // TODO: Run test with this to see exactly what parameter data looks like, and document here
  console.log(info) 
}
