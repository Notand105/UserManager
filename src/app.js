// ###########################################################################
// ############################# IMPORTS / REQUIRES ##########################
// ###########################################################################

const hapi = require("@hapi/hapi");
const path = require("path");

//for loading static content

const inert = require("inert");

// process for dotenv

const process = require("process");

//encrypting passwords

const md5 = require("md5");

//dotenv

require("dotenv").config({ path: "./.env" });

//cookies authentication

const cookie = require("@hapi/cookie");

// ###########################################################################
// ################################# DATABASE ################################
// ###########################################################################

const mongoose = require("mongoose");
//get the conection to de database from .env file
const urlMongodb = process.env.MONGODB_CONECCTION;

mongoose.set("strictQuery", true);

mongoose
  .connect(urlMongodb)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

//Mongoose model
const User = mongoose.model("user", {
  name: String,
  lastname: String,
  active: Boolean,
  scope: String,
  rut: String,
  email: String,
  password: String, //TODO protect with md5
});

// ###########################################################################
// #############################  SERVER INIT ################################
// ###########################################################################

const init = async () => {
  //Configurar el servidor

  const server = new hapi.Server({
    port: 3000,
    host: "localhost",
    routes: {
      files: {
        relativeTo: path.join(__dirname, "public"),
      },
    },
  });

  //habilita el mostrar archivos estaticos
  await server.register(inert);

  //habilita el uso de views
  await server.register(require("@hapi/vision"));

  //configurando el uso de views
  server.views({
    engines: {
      html: require("handlebars"),
    },
    relativeTo: __dirname,
    path: "templates",
    isCached: false,
  });

  await server.register(cookie);

  //configurar cookies

  server.auth.strategy("login", "cookie", {
    cookie: {
      name: "session",
      password: "really_really_secure_password_at_least_32_characters_long",
      isSecure: false,
      ttl: 6 * 60 * 60 * 1000, // 6 horas de duracion de la autenticacion
    },
    redirectTo: "/login",
    validate: async (request, session) => {
      let LoginUser = await User.find({
        email: session.username,
        password: session.password,
        active: true,
      });
      if (LoginUser.length === 0) {
        return { isValid: false };
      }
      return { isValid: true };
    },
  });

  //apply the authentication to every page
  server.auth.default("login");

  // ##########################################################################
  // ############################# ROUTES #####################################
  // ##########################################################################

  server.route({
    method: "GET",
    path: "/",
    options: {
      auth: {
        mode: "try",
      },
    },
    handler: (request, h) => {
      if (request.auth.isAuthenticated) {
        return h.redirect().location("/users");
      }
      return h.redirect().location("/login");
    },
  });

  //REGISTER TO ADD AN USER

  server.route({
    method: "GET",
    path: "/register",
    options: {
      auth: {
        mode: "try",
      },
    },
    handler: (request, h) => {
      //TODO mostrar el formulario para agregar usuario
      return h.view("register");
    },
  });

  //HANDLE THE SUBMIT TO ADD A NEW USER

  server.route({
    method: "POST",
    path: "/register",
    options: {
      auth: {
        mode: "try",
      },
    },
    handler: async (request, h) => {
      let data = {
        name: request.payload.name,
        lastname: request.payload.lastname,
        scope: request.payload.scope,
        rut: request.payload.rut,
        email: request.payload.email,
        password: md5(request.payload.password),
        active: true,
      };
      let newUser = new User(data);
      await newUser.save();
      if (request.auth.isAuthenticated) {
        return h.redirect().location("/users");
      }
      return h.redirect().location("/login");
    },
  });

  //LOGIN

  server.route({
    method: "GET",
    path: "/login",
    options: {
      auth: {
        mode: "try",
      },
    },
    handler: (request, h) => {
      //TODO mostrar el formulario para agregar usuario
      return h.view("login");
    },
  });

  server.route({
    method: "POST",
    path: "/login",
    options: {
      auth: {
        mode: "try",
      },
    },
    handler: async (request, h) => {
      //TODO recibir el usuario agregado y añadirlo a la base de datos
      let data = {
        email: request.payload.email,
        password: md5(request.payload.password),
      };
      request.cookieAuth.set({ username: data.email, password: data.password });
      return h.redirect().location("/users");
    },
  });

  //SHOW THE USERS IN THE DATABASE

  server.route({
    method: "GET",
    path: "/users",

    handler: async (request, h) => {
      //TODO mostrar los usuarios que se encuentren en la base de dates
      //lean permite recibir un objeto json en lugar de uno de mongoose
      let users = await User.find().lean();
      return h.view("users", {
        users: users,
      });
    },
  });

  //DELETE THE USER WITH THE ID MATCHING THE PARAMS

  server.route({
    method: "GET",
    path: "/users/delete/{id}",

    handler: async (request, h) => {
      //TODO eliminar un usuario dependiendo del id que reciba
      let id = request.params.id;
      User.deleteOne({ _id: id })
        .then(() => {
          console.log("deleted element" + id);
        })
        .catch((err) => {
          console.log(err);
        });
      return h.redirect().location("/users");
    },
  });

  //SHOW THE FORM TO EDIT A USER

  server.route({
    method: "GET",
    path: "/users/edit/{id}",

    handler: async (request, h) => {
      let id = request.params.id;
      let userToEdit = await User.find({ _id: id }).lean();
      return h.view("EditUser", {
        userToEdit,
      });
    },
  });

  //HANDLE THE EDIT FORM

  server.route({
    method: "POST",
    path: "/users/edit/{id}",
    handler: async (request, h) => {
      let id = request.params.id;
      let data = {
        name: request.payload.name,
        lastname: request.payload.lastname,
        scope: request.payload.scope,
        rut: request.payload.rut,
        email: request.payload.email,
        password: md5(request.payload.password),
      };

      let editedUser = await User.findOneAndUpdate({ _id: id }, data, {
        new: true,
      });
      console.log(editedUser);
      return h.redirect().location("/users");
    },
  });

  server.route({
    method: "GET",
    path: "/users/toggle/{id}",
    handler: async (request, h) => {
      const id = request.params.id;
      //buscamos el usuario que tenga el id correspondinete
      let userToToggle = await User.find({ _id: id }).lean();
      //obtenemos la propiedad active de ese usuario
      property = userToToggle[0].active;
      //actualiaqmos lq propiedad al contrario de lo que era
      const disabledUser = await User.findOneAndUpdate(
        { _id: id },
        { active: !property },
        {
          new: true,
        }
      );
      return h.redirect().location("/");
    },
  });

  server.route({
    method: "GET",
    path: "/logout",
    handler: async (request, h) => {
      request.cookieAuth.clear();
      return h.redirect().location("/");
    },
  });

  server.route({
    method: "GET",
    path: "/{any*}",
    options: {
      auth: {
        mode: "try",
      },
    },
    handler: (request, h) => {
      return h.view("404");
    },
  });

  //inicializamos el servidor
  await server.start();
  console.log(`server running on ${server.info.uri}`);
};

init();
