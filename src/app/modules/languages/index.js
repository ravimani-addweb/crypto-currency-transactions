import angular from 'angular';

// Create the module where our functionality can attach to
let app = angular.module('app.lang', ['pascalprecht.translate']);

// Include languages
import EnglishProvider from './en';
app.config(EnglishProvider);

import ChineseProvider from './zh';
app.config(ChineseProvider);

import PolishProvider from './pl';
app.config(PolishProvider);

import JapaneseProvider from './ja';
app.config(JapaneseProvider);

import GermanProvider from './de';
app.config(GermanProvider);

import RussianProvider from './ru';
app.config(RussianProvider);

import SpanishProvider from './es';
app.config(SpanishProvider);

export default app;
