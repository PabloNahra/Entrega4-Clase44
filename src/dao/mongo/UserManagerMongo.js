import { userModel } from "../../models/user.model.js"
import mongoose from "mongoose";
import { uploader } from "../../utils/multer.js";


export class UserManager {
  constructor(path) {
    this.path = path;
  }

  async get() {
    console.log("User Manager Mongo");
    try {
      const users = await userModel.find();
      return { users };
    } catch (error) {
      console.error(error);
      return { message: `No podemos devolver los usuarios - ${error}` };
    }
  }

  async changeRole(uId) {
    try {
      // Chequear que el userID es un ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(uId);
      if (!isValidObjectId) {
        return { message: `ID de usuario inválido ${uId}` };
      }
      // Chequear que el userID existe
      const user = await userModel.findOne({ _id: uId });
      if (!user) {
        return { message: "Usuario inexistente" };
      }

      // Si vamos a pasar a un usuario a Premium debe tener cargadas las imagenes: Identificación, Comprobante de domicilio, Comprobante de estado de cuenta
      const requiredValues = ["COMP_DOMICILIO", "COMP_ESTADO_CTA", "IDENTITY"];
      let allValuesPresent = true;

      for (const val of requiredValues) {
        if (!user.documents.some(doc => doc.name.toUpperCase().includes(val))) {
          allValuesPresent = false;
          break;
        }
      }

      // Modificar el Role de User por Premium y viceversa
      const userRole = user.role.toUpperCase();
      const allowedRoles = ["USER", "PREMIUM"];

      // Si lo vamos a pasar de PREMIUM A USER
      if (userRole === "PREMIUM") {
        console.log("PREMIUM A USER");
        let newRole = userRole === "USER" ? "PREMIUM" : "USER"; // Cambio de rol
        const updateUserRole = await userModel.updateOne(
          { _id: uId },
          { $set: { role: newRole } }
        );

        if (updateUserRole.modifiedCount > 0) {
          return {
            message: `Rol modificado - User: ${user.email} - Nuevo Rol: ${newRole}`,
          };
        }
      } else if (
        // Si vamos a pasar de USER A PREMIUM
        (user.role.toUpperCase() === "USER") &
        allValuesPresent === true
      ) {
        console.log("USER A PREMIUM");
        let newRole = userRole === "USER" ? "PREMIUM" : "USER"; // Cambio de rol
        const updateUserRole = await userModel.updateOne(
          { _id: uId },
          { $set: { role: newRole } }
        );

        if (updateUserRole.modifiedCount > 0) {
          return {
            message: `Rol modificado - User: ${user.email} - Nuevo Rol: ${newRole}`,
          };
        }
      } else {
        console.log("NO MODIFICABLE");
        return { message: "El rol del usuario NO es modificable" };
      }
    } catch (error) {
      console.error(error);
      return { message: `No se pudo modificar el rol - ${error}` };
    }
  }

  async changeRole_OLD(uId) {
    try {
      // Chequear que el userID es un ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(uId);
      if (!isValidObjectId) {
        return { message: `ID de usuario inválido ${uId}` };
      }
      // Chequear que el userID existe
      const user = await userModel.findOne({ _id: uId });
      if (!user) {
        return { message: "Usuario inexistente" };
      }

      // Si vamos a pasar a un usuario a Premium debe tener cargadas las imagenes: Identificación, Comprobante de domicilio, Comprobante de estado de cuenta
      const requiredValues = ['COMP_DOMICILIO', 'COMP_ESTADO_CTA', 'IDENTITY'];
      
      if (
        user.role.toUpperCase()!="PREM" & 
        requiredValues.some(val => user.documents.some(doc => doc.name.toUpperCase().includes(val)))) {
        console.log("Al menos un documento de cada tipo requerido está presente");
      } else {
        console.log("Faltan documentos para actualizar a PREMIUM");
      }
      

      // Modificar el Role de User por Premium y viceversa
      const userRole = user.role.toUpperCase();
      const allowedRoles = ["USER", "PREMIUM"];
      if (allowedRoles.includes(userRole)) {
        console.log(userRole);
        let newRole = userRole === "USER" ? "PREMIUM" : "USER"; // Cambio de rol
        const updateUserRole = await userModel.updateOne(
          { _id: uId },
          { $set: { role: newRole } }
        );

        if (updateUserRole.modifiedCount > 0) {
          return {
            message: `Rol modificado - User: ${user.email} - Nuevo Rol: ${newRole}`,
          };
        }
      } else {
        return { message: "El rol del usuario NO es modificable" };
      }


    } catch (error) {
      console.error(error);
      return { message: `No se pudo modificar el rol - ${error}` };
    }
  }

  async postDocuments(uId, files) {
    try {
      // Chequear que el userID es un ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(uId);
      if (!isValidObjectId) {
        return { message: `ID de usuario inválido ${uId}` };
      }
      // Chequear que el userID existe
      const user = await userModel.findOne({ _id: uId });
      if (!user) {
        return { message: "Usuario inexistente" };
      }

      // Subir archivos con Multer
      // Recorrer el array de files e imprimir los valores; luego guardarlos en documents de user
      files.forEach((file) => {
        console.log("Originalname:", file.originalname);
        console.log("Filename:", file.filename);
        console.log("Path:", file.path);

        // Verificar si el archivo ya está en la matriz documents del usuario
        const existingDocumentIndex = user.documents.findIndex(
          (doc) => doc.name === file.originalname
        );

        // Si el archivo no está en la matriz documents, lo insertamos
        if (existingDocumentIndex === -1) {
          const fileNameWithoutExtension = file.originalname.slice(0, file.originalname.lastIndexOf('.'));
          user.documents.push({
            name: fileNameWithoutExtension,
            reference: file.path,
          });
        } else {
          // Si el archivo ya existe, actualizamos la referencia
          user.documents[existingDocumentIndex].reference = file.path;
        }
      });
      
      // Guardar los cambios en el usuario
      await user.save();

      return { message: `Imagenes actualizadas` };

    } catch (error) {
      console.error(error);
      return { message: `No se pudieron subir los archivos - ${error}` };
    }
  }
}


export default UserManager
