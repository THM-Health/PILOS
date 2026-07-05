// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Error that can be thrown if a passed parameter hasn't the expected type.
 */
export default class WrongTypeError extends Error {
  /**
   * Constructor that initializes the error message.
   *
   * @param parameter {String} Parameter that had the wrong type.
   * @param type {String} Type that was expected for the parameter.
   */
  constructor(parameter, type) {
    super(`Expected '${parameter}' to be of type '${type}'!`);
  }
}
