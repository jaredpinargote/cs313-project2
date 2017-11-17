CREATE TABLE public."CurrentVoting" (
)
WITH (
	OIDS=FALSE
) ;
ALTER TABLE public."CurrentVoting" ADD "gameID" int4 NULL ;
ALTER TABLE public."CurrentVoting" ADD "combo1ID" int4 NULL ;
ALTER TABLE public."CurrentVoting" ADD "combo2ID" int4 NULL ;
ALTER TABLE public."CurrentVoting" ADD score int4 NOT NULL DEFAULT 0 ;
ALTER TABLE public."CurrentVoting" ADD CONSTRAINT currentvoting_games_fk FOREIGN KEY ("gameID") REFERENCES public."Games"(id) ON DELETE CASCADE ;
ALTER TABLE public."CurrentVoting" ADD CONSTRAINT currentvoting_combos_1_fk FOREIGN KEY ("combo1ID") REFERENCES public."Combos"(id) ON DELETE CASCADE ;
ALTER TABLE public."CurrentVoting" ADD CONSTRAINT currentvoting_combos_2_fk FOREIGN KEY ("combo2ID") REFERENCES public."Combos"(id) ON DELETE CASCADE ;
ALTER TABLE public."Games" DROP COLUMN "playerNumber" ;
ALTER TABLE public."Games" ADD "stageID" int4 NULL ;
