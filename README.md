# UserManager

## Ingresar

se puede ingresar directamente en el login utilizando las credenciales de prueba: 

  - username: test@gmail.com
  
  - password: test
 
o registrar un nuevo usuario y utilizar sus credenciales para ingresar posteriormente.

## Puntos a considerar

- Cada usuario registrado comienza con un active: true representando un status de enabled y por lo tanto siendo capaz de iniciar sesión, este status puede ser cambiado desde la lista de usuarios.
En caso de deshabilitar el status del usuario con el que se inició sesión, dicha sesión expirar

- Si bien las contraseñas no deberian aparecer a simple vista, estas se muestran con el fin de demostrar el correcto encriptado.

- A pesar de que en condiciones normales el archivo .env no deberia ser subido a github, en este caso es necesario pues contiene los datos de conexion a la 
base de datos indispensables para el correcto funcionamiento de la aplicación. 
