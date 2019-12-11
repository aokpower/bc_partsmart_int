// Note: Relies on AlertifyJS library
// AlertifyJS type declarations
interface AlertifyJSStatic {
  success(msg: string): void;
  error(msg: string): void;
  alert(title: string, msg: string): void;
}

declare var alertify: AlertifyJSStatic;

// STATIC INFO
const phone_number = "1 (844) 587-6937";

// Utility:
class Util {
  public static promiseTimeout(ms: number, promise: Promise<any>): Promise<any> {
    let timeout = new Promise((_resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject('Timed out in '+ms+' ms.');
      }, ms);
    });

    return Promise.race([promise, timeout]);
  }

  public static throwIfResNotOk(response: Response): Response {
    if (!response.ok) throw new Error(response.statusText)
    return response;
  }
}

interface StringyObj { [key: string]: string }

// BigCommerce:
type CartJSON = StringyObj; // more specified type alias

class BCCart {
  public exists: boolean;
  private id: string | null;
  private cart: CartJSON | null;
  private get_cart_path: string;
  private carts: Array<CartJSON>;

  /* Call instance methods through here. Constructs a new instance and updates.
     At the end of the promise chain, the instance should be thrown away. This,
     along with the private constructor, give at least a weak guarantee of cart
     data being fresh and prevents a lot of async headaches while enabling some
     synchronous accessors internally in the chain. */

  public static async use(): Promise<BCCart> {
    return (new BCCart).update()
  }

  private constructor() {
    this.carts = [];
    this.cart = null;
    this.id = null;
    this.exists = false;

    this.get_cart_path = '/api/storefront/carts?include=';
  }

  public async update(): Promise<BCCart> {
    this.carts = await this.get_carts();
    this.exists = this.carts.length > 0;
    this.cart = this.carts[0] || null;
    this.id = this.cart && this.cart["id"] || null;
    return this;
  }

  public async addItems(productId: string, quantity: number): Promise<CartJSON> {
    const payload = JSON.stringify({
      'lineItems': [{
        "productId": String(productId),
        "quantity": Number(quantity)
      }]
    });
    let cart_endpoint: string;
    if (this.exists) { // if cart already exists, use the first one
      cart_endpoint = '/api/storefront/carts/' + this.id + '/items';
    } else {              // if cart doesn't exist, make a new one
      cart_endpoint = '/api/storefront/cart';
    }

    const res = await fetch(cart_endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    Util.throwIfResNotOk(res);
    return await res.json();
  }

  private get_carts(): Promise<Array<CartJSON>> {
    return fetch(this.get_cart_path, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'credentials': 'include',
      }
    }).then(Util.throwIfResNotOk)
      .then(r => r.json());
  }
}

interface Result<T> {
  val?: T;
  exists: boolean;
}

class Lookup {
   public static async idOfSku(ari_sku: string): Promise<Result<string>> {
    const endpoint: string = "https://idlookup.aokpower.com/check/";
    const response = await fetch(endpoint+String(ari_sku));
    if (!response.ok) throw this.serviceError();

    const result = await response.text();
    if (result === "") return { exists: false };
    return { val: result, exists: true };
  }

  public static serviceError(): Error {
    return new Error("There was an internal error in the part id lookup service.");
  }

  public static partNotAvailErr(sku: string): Error {
    return new Error("This part (" + sku + ") isn't available in the online store.");
  }
}

class ARIParams {
  private params: StringyObj;
  public sku: string;
  public quantity: number;

  constructor(params_string: string) {
    this.params = params_string.split("&")
      .map(param_string => param_string.split("="))
      .reduce((obj: StringyObj, param_pair) => {
        obj[param_pair[0]] = param_pair[1];
        return obj;
      }, {});

    this.sku = this.params["arisku"];
    this.quantity = Number(this.params["ariqty"]);
  }
}

// Callback
/* Callback only works if addToCartARI is in traditional
   javascript "function _name_() ..." syntax */
async function addToCartARI(params_str: string): Promise<any> {
  try {
    const params = new ARIParams(params_str);
    console.log("Attempting to add product " + params.sku + " to cart.");

    // lookup sku using id_lookup service...
    const result = await Lookup.idOfSku(params.sku);
    console.log("looking up part " + params.sku + "...");
    if (!result.exists) throw Lookup.partNotAvailErr(params.sku);
    console.log("Found " + params.sku + ", id = " + (result.val!));

    // Add to cart
    const cart = await BCCart.use();
    await cart.addItems((result.val!), params.quantity);
    const msg = "Successfully added " + params.sku + " to cart.";
    console.log(msg);
    alertify.success(msg);
  } catch (err) {
    let err_msg = "We couldn't add your item to the cart because: ";
    err_msg += err.message + "\n";
    err_msg += "We're sorry for the inconvenience, try calling us at " + phone_number + ".";
    alertify.alert("Something went wrong!", err_msg);
    console.error(err_msg);
  }
}
