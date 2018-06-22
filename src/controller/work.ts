import { Request, Response, NextFunction } from 'express';
import Work from '../model/workModel';
import { userInfo, endianness } from 'os';
import Userwork from '../model/userworkModel';
import { ResponseMessage, ErrorMessages } from '../util/utilities';

export let getAllWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const idList = await Work.find({}).distinct('_id');
        return res.status(200).json(new ResponseMessage([], { workIdList: idList }));
    } catch (error) {
        console.log(error);
        return res.status(200).json(new ResponseMessage([ErrorMessages.unknownError]));
    }
}
export let getWorkById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const work = await Work.findById(req.params.workId);
        res.status(200).json(new ResponseMessage([], { work }));
    } catch (error) {
        console.log(error);
        res.status(200).json(new ResponseMessage([ErrorMessages.unknownError]));
    }
}

export let create = async (req: Request, res: Response, next: NextFunction) => {
    const work = new Work({
        name: req.body.name,
        description: req.body.description,
    });
    const errors: ErrorMessages[] = [];
    if (await Work.findOne({ name: req.body.name })) errors.push(ErrorMessages.workNameExist);
    if (errors.length === 0) {
        await work.save();
        res.status(200).json(new ResponseMessage([], { work }));
    } else res.status(200).json(new ResponseMessage(errors));
}

export let updateById = async (req: Request, res: Response, next: NextFunction) => {
    let errors: ErrorMessages[] = [];
    let targetWork;
    let namedWork;
    try {
        [targetWork, namedWork] = await Promise.all([
            Work.findById(req.params.workId).exec(),
            Work.find({ name: req.body.name }).exec(),
        ]);
        if (namedWork.filter((value) => { value._id !== req.params.workId }).length !== 0) errors.push(ErrorMessages.workNameExist);
        if (!targetWork) errors.push(ErrorMessages.workNotExist);
        if (errors.length === 0) {
            targetWork.name = req.body.name || targetWork.name;
            targetWork.description = req.body.description || targetWork.description;
            await targetWork.save();
        }
    } catch (error) {
        console.log(error);
        errors.push(ErrorMessages.unknownError)
    }
    if (errors.length === 0) {
        return res.status(200).json(new ResponseMessage([], { targetWork }));
    } else {
        return res.status(200).json(new ResponseMessage(errors));
    }
}
export let deleteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deleted = await Work.findByIdAndRemove(req.params.workId);
        if (!deleted) return res.status(200).json(new ResponseMessage([ErrorMessages.workNotExist]));
        return res.status(200).json(new ResponseMessage());
    } catch (error) {
        console.log(error);
        return res.status(200).json(new ResponseMessage([ErrorMessages.unknownError]));
    }
}

export let like = async (req: Request, res: Response) => {
    try {
        const result = await Userwork.setLike(req.user.id, req.params.workId, true);
        return res.status(200).json(new ResponseMessage());
    } catch (error) {
        console.log(error);
        return res.status(200).json(new ResponseMessage([ErrorMessages.unknownError]));
    }
}
export let unlike = async (req: Request, res: Response) => {
    try {
        const result = await Userwork.setLike(req.user.id, req.params.workId, false);
        return res.status(200).json(new ResponseMessage());
    } catch (error) {
        console.log(error);
        return res.status(200).json(new ResponseMessage([ErrorMessages.unknownError]));
    }
}
export let rate = async (req: Request, res: Response, next: NextFunction) => {
    const rating: string = req.body.rating;
    try {
        let userwork = await Userwork.findOne({ userId: req.user.id, workId: req.body.workId });
        if (!userwork) {
            userwork = new Userwork({
                userId: req.user.id,
                workId: req.body.workId,
                rating,
            });
            await userwork.save();
        } else {
            await userwork.set('rating', rating);
        }
        return res.status(200).json(new ResponseMessage());
    } catch (error) {
        return res.status(200).json(new ResponseMessage([ErrorMessages.unknownError]));
    }
}