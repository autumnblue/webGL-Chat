

-- -----------------------------------------------------
-- For heroku dev USE heroku_e5f6ebfebdf4ff3
-- -----------------------------------------------------

-- -----------------------------------------------------
-- For local dev USE webgl_chat
-- -----------------------------------------------------
-- CREATE SCHEMA IF NOT EXISTS `webgl_chat` DEFAULT CHARACTER SET utf8 ;

USE `webgl_chat`;

DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS room_mapping CASCADE;
DROP TABLE IF EXISTS room_sharing CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS clothes CASCADE;
DROP TABLE IF EXISTS user CASCADE;

-- -----------------------------------------------------
-- Table `user`
-- -----------------------------------------------------
CREATE TABLE user (
  user_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(16) NOT NULL,
  password VARCHAR(255) NOT NULL,
  create_time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  avatar VARCHAR(255) NOT NULL DEFAULT 'assets/avatars/Female2/Female2',
  PRIMARY KEY (user_id),
  UNIQUE INDEX username_UNIQUE (username ASC));

-- -----------------------------------------------------
-- Table `rooms`
-- -----------------------------------------------------
CREATE TABLE rooms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner INT NOT NULL,
  name VARCHAR(16) NOT NULL UNIQUE,
  json MEDIUMTEXT NULL,
  PRIMARY KEY (id),
  INDEX owner_fk_idx (owner ASC),
  CONSTRAINT owner_fk
    FOREIGN KEY (owner)
    REFERENCES user (user_id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `room_mapping`
-- -----------------------------------------------------
CREATE TABLE room_mapping (
  idroom_mapping INT NOT NULL AUTO_INCREMENT,
  room VARCHAR(16) NOT NULL,
  mapping TEXT(65535) NOT NULL,
  PRIMARY KEY (idroom_mapping),
  INDEX rooms_fk_idx (room ASC),
  CONSTRAINT rooms_fk
    FOREIGN KEY (room)
    REFERENCES rooms (name)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `sharing room to edit`
-- -----------------------------------------------------
CREATE TABLE `room_sharing` (
  `room_id` INT UNSIGNED NOT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `room_id`),
  INDEX `room_sharing_room_id_fk_idx` (`room_id` ASC),
  CONSTRAINT `room_sharing_room_id_fk`
    FOREIGN KEY (`room_id`)
    REFERENCES `rooms` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `room_sharing_user_id_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

-- Table `clothes`
-- -----------------------------------------------------
CREATE TABLE clothes (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NULL,
  avatar VARCHAR(255) NULL,
  json VARCHAR(1023) NULL,
  PRIMARY KEY (id))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `user_settings`
-- -----------------------------------------------------
CREATE TABLE user_settings (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  clothing VARCHAR(1023) NULL,
  PRIMARY KEY (id),
  INDEX fk_user_settings_user_idx (user_id ASC),
  CONSTRAINT fk_user_settings_user
    FOREIGN KEY (user_id)
    REFERENCES user (user_id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `resources`
-- -----------------------------------------------------
CREATE TABLE `resources` (
  `id` varchar(60) NOT NULL,
  `folder` varchar(255) NOT NULL,
  `data` longtext NOT NULL,
  `type` varchar(12) NOT NULL,
  `token` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`,`folder`),
  UNIQUE KEY `token_UNIQUE` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=266 DEFAULT CHARSET=utf8;
