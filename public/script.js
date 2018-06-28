var PRICE = 9.99;
var LOAD_NUM = 10;

var pusher = new Pusher("be4fd356f00528720add", {
  cluster: "eu",
  encrypted: true
});

/* This below is how we can create a Vue INSTANCE, we use the 'new' keyword followed by the 'Vue' CONSTRUCTOR where
we pass an OBJECT that will contain all the properties that we may need. The FIRST property that we add will pretty
much ALWAYS be the 'el'(short for 'element'), with this property we define the ROOT element for Vue, in our case 
we've choose the 'div' element with the 'app' id, in this way Vue we'll be able to MODIFY or ADD(do whatever) with
EVERY element inside this 'app' div */
new Vue({
  el: "#app",
  /* ANY property that we put inside this 'data' Object below is going to be accessible in the DOM, so if for 
  example we put a property called 'total' with a value of zero then we can PRINT this property in the DOM. All we
  have to do is REFER to this 'total' property here below INSIDE the index.html file by using the "Mustache Syntax"
  of the DOUBLE Curly braces(like this {{ total }}) */
  data: {
    total: 0,
    /* Inside this 'items' Array here below EACH of these items NEEDS to be an JavaScript OBJECT. Now to RENDER
    these items inside the DOM we must use the 'v-for' Vue DIRECTIVE which allows us to iterate through an Array,
    so this directive we'll allow us to PRINT these items into the DOM pretty much */
    items: [],
    cart: [],
    results: [],
    newSearch: "anime",
    lastSearch: "",
    loading: false,
    price: PRICE,
    pusherUpdate: false
  },
  /* 'computed' properties are like a cross(un incrocio) between 'data' properties and 'methods'. Unlike a 'data'
  property a 'computed' property CAN be a Function BUT unlike a normal 'method' Vue.js is going to re-evaluate, so
  re-run this Function(the 'noMoreItems' in our case) as the dependent variables CHANGES. In our case if for example
  the values of 'items.length' or 'results.length' changes, Vue.js is going to RERUN the function with the NEW 
  values automatically */
  computed: {
    noMoreItems: function() {
      return (
        this.results.length === this.items.length && this.results.length > 0
      );
    }
  },
  /* With this 'watcher' we have the ability to execute "CUSTOM LOGIC" when the CONTENTS of our 'cart' Array CHANGES
  The next step now is that WHEN that 'cart' CHANGES we want to TAKE the 'state' of the 'cart' and SEND that data
  to our 'PUSHER'(a website that allow us to control the changes in our cart also if we've MULTIPLE pages opened
  in the browser and we add or remove stuff from any of those pages, we would see the SAME results reflected on ALL
  pages */
  watch: {
    /* For the properties of this 'watch' Object we have to use the SAME name that we've used in the 'data' above.
    So in our case we want to WATCH the 'cart' property that we've INSIDE the 'data' Object ABOVE, so HERE we have
    to use the SAME name for the property of this 'watch' Object, so pretty much the properties of this 'watch'
    Object NEEDS to be the SAME as the properties we want to WATCH */
    cart: {
      /* This 'val' refers to the CURRENT value of the watched Object or Array(in our case the current value of
      the 'cart' Array of course) */
      handler: function(val) {
        if (!this.pusherUpdate) {
          /* Here we're sending a POST request with the help of the '$http' method of the 'vue-resource' package. 
        The 'post' will take TWO arguments, the first is the URL where we want our Ajax call to go, and the second
        argument is the DATA that we want to send along with this POST request, so the 'val' argument we're passing
        to this 'handler' function that refers to the CURRENT value of the watched 'cart' Array */
          this.$http.post("/cart_update", val);
        } else {
          this.pusherUpdate = false;
        }
      },
      /* By DEFAULT a "watcher" will only WATCH the property itself and NOT the things NESTED inside it, so in our
      case we were just watching on changes of the 'cart' property itself(that is the Array we've defined in the
      'data' Object above) but NOT on changes happening to his elements. By setting this 'deep' property to TRUE(by
      DEFAULT is set to 'false') we're telling Vue that it should ALSO look for the NESTED changes of this 'cart'
      property. We're doing this so that we can trigger this watcher when we MODIFY by adding or removing elements
      to the items inside our cart(so when we click on the '+' or '-' buttons) */
      deep: true
    }
  },
  methods: {
    appendItems: function() {
      if (this.items.length < this.results.length) {
        var append = this.results.slice(
          this.items.length,
          this.items.length + LOAD_NUM
        );
        this.items = this.items.concat(append);
      }
    },
    onSubmit: function() {
      /* We're putting all the code inside this 'if' statement to PREVENT the error that comes when the user press
      the search button with an EMPTY field, so without writing something inside the 'search' input. In this way 
      we're making sure that the 'newSearch.length' is AT least 1(or above) and NOT zero, so that it will evaluate
      to 'true' and the code inside the 'if' statement will run */
      if (this.newSearch.length) {
        // Before we run our AJAX call below ('this.$http.get') we are removing all the elements from the 'items' Array
        this.items = [];
        this.loading = true;
        /* 'this.$http' is how we can access the 'vue-resource' Library, then we use the 'get' method where we pass
      a URL that returns a promise, so we use the 'then' method to RESOLVE the response Object we get back from
      the imgur api server */
        this.$http.get("/search/".concat(this.newSearch)).then(function(res) {
          this.lastSearch = this.newSearch;
          this.results = res.data; // We're storing ALL the elements we got back from the server in the 'results' Array
          this.appendItems();
          this.loading = false;
        });
      }
    },
    addItem: function(index) {
      this.total += PRICE;
      var item = this.items[index];
      var found = false;
      for (var i = 0; i < this.cart.length; i++) {
        if (this.cart[i].id === item.id) {
          found = true;
          this.cart[i].qty++;
          break;
        }
      }
      if (!found) {
        this.cart.push({
          id: item.id,
          title: item.title,
          qty: 1,
          price: PRICE
        });
      }
    },
    inc: function(item) {
      item.qty++;
      this.total += PRICE;
    },
    dec: function(item, index) {
      item.qty--;
      this.total -= PRICE;
      if (item.qty <= 0) {
        for (var i = 0; i < this.cart.length; i++) {
          if (this.cart[i].id === item.id) {
            /* The FIRST parameter of the 'splice' method is the POSITION in the Array from where we want to start
            the cut, and the SECOND parameter is the NUMBER of how many items we want to remove from our Array */
            this.cart.splice(i, 1);
            break; // There is no need to continue the 'for' loop when we've already found the item, so we leave it
          }
        }
      }
    }
  },
  filters: {
    /* A 'filter' will ALWAYS have an ARGUMENT that is passed to it(in our case is 'price') and also will ALWAYS
    return something */
    currency: function(price) {
      // The 'toFixed' JavaScript method below will CONVERT a number into a string, keeping ONLY two decimanls
      return "$".concat(price.toFixed(2));
    }
  },
  mounted: function() {
    this.onSubmit();

    var vueInstance = this;
    var elem = document.getElementById("product-list-bottom");
    /* Here below we're using the 'scrollMonitor' Library to "watch" when we enter in the viewport of the 'elem' 
    variable we've just created above. So now EVERY time we enter the viewport of this 'product-list-bottom' element 
    inside the DOM, the callback we've added INSIDE the 'enterViewport' method is going to FIRE and it will ADD 
    additional items in our browser page */
    var watcher = scrollMonitor.create(elem);
    watcher.enterViewport(function() {
      vueInstance.appendItems();
    });
    var channel = pusher.subscribe("cart");
    channel.bind("update", function(data) {
      vueInstance.pusherUpdate = true;
      vueInstance.cart = data;
      vueInstance.total = 0;
      for (var i = 0; i < vueInstance.cart.length; i++) {
        vueInstance.total += PRICE * vueInstance.cart[i].qty;
      }
    });
  }
});
